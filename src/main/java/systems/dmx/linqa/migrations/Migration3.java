package systems.dmx.linqa.migrations;

import systems.dmx.core.Topic;
import systems.dmx.core.service.Inject;
import systems.dmx.core.service.Migration;
import systems.dmx.core.util.JavaUtils;
import systems.dmx.files.FilesService;
import systems.dmx.files.UploadedFile;
import static systems.dmx.linqa.Constants.*;
import systems.dmx.linqa.ImageScaler;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Document.OutputSettings;
import org.jsoup.nodes.Element;
import org.jsoup.parser.CharacterReader;
import org.jsoup.select.Elements;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;
import java.util.logging.Logger;
import javax.imageio.ImageIO;



/**
 * Transforms data-URLs to "real" URLs.
 * Stores images in file repo instead, possibly scaled down.
 * <p>
 * Part of Linqa 1.8
 * Runs ALWAYS.
 */
public class Migration3 extends Migration {

    // ------------------------------------------------------------------------------------------------------- Constants

    private static final String IMAGE_FILE_NAME = "zw-image-%d.%s";
    private static final String STATS = "  %-20s - topics: %3d, image tags: %3d, data-URLs: %3d, images: %3d, " +
        "duplicates: %3d -> %3d repo files created\n";

    // ---------------------------------------------------------------------------------------------- Instance Variables

    @Inject private FilesService files;

    private Map<String, String> storedImages = new HashMap();   // base64 -> image URL (in file repo)

    private int imageCount = 0;

    private Map<String, int[]> stats = new TreeMap();           // type URI -> 0: topic count
                                                                //             1: image tag count
                                                                //             2: data URL count
                                                                //             3: image data URL count
                                                                //             4: image duplicate count

    private Logger logger = Logger.getLogger(getClass().getName());

    // -------------------------------------------------------------------------------------------------- Public Methods

    @Override
    public void run() {
        // Note: data-URLs appear in the parent labels as well, duplicated from the child texts
        transformImages(LINQA_NOTE);
        transformImages(LINQA_NOTE_TEXT);
        transformImages(TEXTBLOCK);
        transformImages(TEXTBLOCK_TEXT);
        transformImages(COMMENT);
        transformImages(COMMENT_TEXT);
        //
        StringBuilder sb = new StringBuilder();
        stats.keySet().stream().forEach(typeUri -> {
            sb.append(String.format(STATS, typeUri, stats.get(typeUri)[0], stats.get(typeUri)[1], stats.get(typeUri)[2],
                stats.get(typeUri)[3], stats.get(typeUri)[4], stats.get(typeUri)[3] - stats.get(typeUri)[4]));
        });
        logger.info("##### Image data-URL migration complete #####\n" + sb);
    }

    // ------------------------------------------------------------------------------------------------- Private Methods

    private void transformImages(String typeUri) {
        stats.put(typeUri, new int[5]);
        dmx.getTopicsByType(typeUri).stream().forEach(topic -> {
            inc(typeUri, 0);
            String html = topic.getSimpleValue().toString();
            Document doc = Jsoup.parseBodyFragment(html);
            OutputSettings settings = doc.outputSettings();
            settings.prettyPrint(false);    // default is true, adds line breaks
            Elements images = doc.select("img");
            boolean hasDataUrl = false;
            for (Element image : images) {
                inc(typeUri, 1);
                if (transformImageTag(image, topic)) {
                    hasDataUrl = true;
                }
            }
            if (hasDataUrl) {
                String newHtml = doc.body().html(); // parseBodyFragment() creates an empty document, with head and body
                logger.info("Transformed HTML: " + newHtml);
                topic.setSimpleValue(newHtml);
            }
        });
    }

    /**
     * Transforms the given <img> DOM element:
     * - if the img's "src" attribute holds a data-URL that one is replaced by a reference to an external image file
     * - in case the data-URL does not contain image data (but e.g. is an PDF) the entire <img> element is removed
     * - if the img's "src" attribute does not hold a data-URL no transformation is done
     *
     * @return  true if the DOM has been manipulated, false otherwise
     */
    private boolean transformImageTag(Element image, Topic topic) {
        String src = image.attr("src");
        String typeUri = topic.getTypeUri();
        StringBuilder log = new StringBuilder();
        log.append("---------------------------------------- " + typeUri + " (" + topic.getId() + ")\n" +
            src.substring(0, Math.min(src.length(), 40)) + " -> ");
        if (!src.startsWith("data:")) {
            log.append("not a data-URL");
            logger.info(log.toString());
            return false;
        }
        inc(typeUri, 2);
        CharacterReader reader = new CharacterReader(src);
        reader.consumeTo(':'); reader.advance();
        String mimeType = reader.consumeTo(';'); reader.advance();
        String category = mimeType.split("/")[0];
        if (!category.equals("image")) {
            log.append("not an image! Removing <img> tag ...");
            logger.info(log.toString());
            image.remove();
            return true;
        }
        inc(typeUri, 3);
        String encoding = reader.consumeTo(','); reader.advance();
        if (!encoding.equals("base64")) {
            throw new RuntimeException("Unexpected encoding: \"" + encoding + "\"");
        }
        String base64 = src.substring(reader.pos());
        log.append("mimeType=\"" + mimeType + "\", encoding=\"" + encoding + "\", size=" + base64.length());
        logger.info(log.toString());
        String url = writeImageFile(base64, mimeType, typeUri);
        image.attr("src", url);
        return true;
    }

    /**
     * Creates an image file based on the given Base64 data to file repo, possibly scale down before.
     * If these data has been written already, nothing is performed.
     *
     * @return  a (relative) file repo URL to access the created filed.
     */
    private String writeImageFile(String base64, String mimeType, String typeUri) {
        try {
            String url = storedImages.get(base64);
            if (url != null) {
                logger.info("Duplicate already stored (" + url + ")");
                inc(typeUri, 4);
                return url;
            }
            String extension = mimeType.split("/")[1];
            String fileName = String.format(IMAGE_FILE_NAME, ++imageCount, extension);
            byte[] bytes = Base64.getDecoder().decode(base64);
            UploadedFile imageFile = new UploadedFile(fileName, bytes.length, new ByteArrayInputStream(bytes));
            UploadedFile scaledImage = new ImageScaler().scale(imageFile);
            String repoPath = files.storeFile(scaledImage, "/").getRepoPath();
            url = "/filerepo/" + JavaUtils.encodeURIComponent(repoPath);
            storedImages.put(base64, url);
            return url;
        } catch (Exception e) {
            throw new RuntimeException("Writing image file failed", e);
        }
    }

    void inc(String typeUri, int item) {
        stats.get(typeUri)[item]++;
    }
}
