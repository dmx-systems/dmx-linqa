package systems.dmx.linqa;

import systems.dmx.core.Topic;
import systems.dmx.core.service.CoreService;
import static systems.dmx.files.Constants.*;
import systems.dmx.files.FilesService;

import org.jcodec.api.FrameGrab;
import org.jcodec.common.model.Picture;
import org.jcodec.scale.AWTUtil;

import java.awt.image.BufferedImage;
import java.io.File;
import javax.imageio.ImageIO;



class VideoFrameGrabber {

    // ------------------------------------------------------------------------------------------------------- Constants

    private static final int SEEK_IN_SECS = 2;

    // ---------------------------------------------------------------------------------------------- Instance Variables

    private CoreService dmx;
    private FilesService fs;

    // ---------------------------------------------------------------------------------------------------- Constructors

    VideoFrameGrabber(CoreService dmx, FilesService fs) {
        this.dmx = dmx;
        this.fs = fs;
    }

    // ----------------------------------------------------------------------------------------- Package Private Methods

    /**
     * Creates a poster frame for a video file and stores it in the DMX file repo. If the given topic is not of type
     * File topic or does not represent a video file nothing is performed.
     */
    void createPosterFrame(Topic topic) {
        try {
            if (topic.getTypeUri().equals(FILE) &&
                    topic.getChildTopics().getString(MEDIA_TYPE, "").startsWith("video/")) {
                File file = fs.getFile(topic.getId());
                Picture picture = FrameGrab.getFrameAtSec(file, SEEK_IN_SECS);
                BufferedImage image = AWTUtil.toBufferedImage(picture);
                ImageIO.write(image, "png", new File(replaceExtension(file.getPath(), ".png")));
            }
        } catch (Exception e) {
            throw new RuntimeException("Creating poster frame for file topic " + topic.getId() + " failed, path=\"" +
                topic.getChildTopics().getString(PATH, "") + "\", mediaType=\"" +
                topic.getChildTopics().getString(MEDIA_TYPE, "") + "\"", e);
        }
    }

    // ------------------------------------------------------------------------------------------------- Private Methods

    private String replaceExtension(String path, String newExt) {
        return path.substring(0, path.lastIndexOf('.')) + newExt;
    }
}
