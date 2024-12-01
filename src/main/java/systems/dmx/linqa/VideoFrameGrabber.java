package systems.dmx.linqa;

import systems.dmx.core.Topic;
import systems.dmx.core.service.CoreService;
import static systems.dmx.files.Constants.*;
import systems.dmx.files.FilesService;
import systems.dmx.files.UploadedFile;

import org.jcodec.api.FrameGrab;
import org.jcodec.common.model.Picture;
import org.jcodec.scale.AWTUtil;

import java.awt.image.BufferedImage;
import java.io.File;
import java.util.logging.Logger;
import javax.imageio.ImageIO;



// used also in Migration 9
public class VideoFrameGrabber {

    // ------------------------------------------------------------------------------------------------------- Constants

    private static final int SEEK_IN_SECS = 2;
    private static final String IMAGE_FORMAT = "png";

    // ---------------------------------------------------------------------------------------------- Instance Variables

    private CoreService dmx;
    private FilesService fs;

    private Logger logger = Logger.getLogger(getClass().getName());

    // ---------------------------------------------------------------------------------------------------- Constructors

    public VideoFrameGrabber(CoreService dmx, FilesService fs) {
        this.dmx = dmx;
        this.fs = fs;
    }

    // ----------------------------------------------------------------------------------------- Package Private Methods

    /**
     * Creates a poster frame for a video file and stores it in DMX file repo. If the given topic is not of type File
     * or does not represent a video file nothing is performed.
     *
     * @return  true if the given topic represents a video file, false otherwise.
     */
    public boolean createPosterFrame(Topic topic) {
        try {
            if (topic.getTypeUri().equals(FILE) &&
                    topic.getChildTopics().getString(MEDIA_TYPE, "").startsWith("video/")) {
                logger.info(topic.getChildTopics().getString(PATH, ""));
                // 1) create poster image
                File video = fs.getFile(topic.getId());
                Picture picture = FrameGrab.getFrameAtSec(video, SEEK_IN_SECS);
                BufferedImage image = AWTUtil.toBufferedImage(picture);
                // 2) write to file repo
                UploadedFile uf = new ImageInputStream(image, IMAGE_FORMAT).get();
                String path = replaceExtension(video.getPath(), IMAGE_FORMAT);
                fs.createFile(uf.getInputStream(), fs.repoPath(new File(path)));
                return true;
            }
            return false;
        } catch (Exception e) {
            throw new RuntimeException("Creating poster frame for file topic " + topic.getId() + " failed, path=\"" +
                topic.getChildTopics().getString(PATH, "") + "\", mediaType=\"" +
                topic.getChildTopics().getString(MEDIA_TYPE, "") + "\"", e);
        }
    }

    // ------------------------------------------------------------------------------------------------- Private Methods

    private String replaceExtension(String path, String newExt) {
        return path.substring(0, path.lastIndexOf('.') + 1) + newExt;
    }
}
