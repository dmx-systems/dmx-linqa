package systems.dmx.linqa.migrations;

import systems.dmx.core.service.Inject;
import systems.dmx.core.service.Migration;
import systems.dmx.files.FilesService;
import systems.dmx.files.UploadedFile;
import static systems.dmx.linqa.Constants.*;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.parser.CharacterReader;
import org.jsoup.select.Elements;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.logging.Logger;
import javax.imageio.ImageIO;
import javax.xml.bind.DatatypeConverter;



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

    // ---------------------------------------------------------------------------------------------- Instance Variables

    @Inject private FilesService files;

    private int imageCount = 0;
    private int nonDataUrls = 0;

    private Logger logger = Logger.getLogger(getClass().getName());

    // -------------------------------------------------------------------------------------------------- Public Methods

    @Override
    public void run() {
        transformImages(LINQA_NOTE_TEXT);
        transformImages(TEXTBLOCK_TEXT);
        transformImages(COMMENT_TEXT);
        throw new RuntimeException("BOOOOM! :-)");
    }

    // ------------------------------------------------------------------------------------------------- Private Methods

    private long transformImages(String typeUri) {
        return dmx.getTopicsByType(typeUri).stream().filter(topic -> {
            String html = topic.getSimpleValue().toString();
            Document doc = Jsoup.parseBodyFragment(html);
            Elements images = doc.select("img");
            for (Element image : images) {
                String src = image.attr("src");
                StringBuilder log = new StringBuilder();
                log.append(typeUri + ":" + topic.getId() + " " + src.substring(0, Math.min(src.length(), 50)) + " -> ");
                if (src.startsWith("data:")) {
                    CharacterReader reader = new CharacterReader(src);
                    reader.consumeTo(':'); reader.advance();
                    String mimeType = reader.consumeTo(';'); reader.advance();
                    String encoding = reader.consumeTo(','); reader.advance();
                    if (!encoding.equals("base64")) {
                        throw new RuntimeException("Unexpected encoding: \"" + encoding + "\"");
                    }
                    log.append("mimeType=\"" + mimeType + "\", encoding=\"" + encoding + "\"");
                    String base64 = reader.consumeTo('"');
                    writeImageFile(base64, mimeType);
                } else {
                    log.append("not a data-URL");
                    nonDataUrls++;
                }
                logger.info(log.toString());
            }
            return true;
        }).count();
    }

    void writeImageFile(String base64, String mimeType) {
        try {
            String extension = mimeType.split("/")[1];
            String fileName = String.format(IMAGE_FILE_NAME, ++imageCount, extension);
            byte[] bytes = DatatypeConverter.parseBase64Binary(base64);
            UploadedFile file = new UploadedFile(fileName, bytes.length, new ByteArrayInputStream(bytes));
            files.storeFile(file, "/");
        } catch (Exception e) {
            throw new RuntimeException("Writing image file failed", e);
        }
    }
}
