package systems.dmx.linqa;

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
     * Creates a poster frame for the given file, provided the file is a video file. Otherwise nothing is performed.
     */
    void createPosterFrame(long fileTopicId) {
        try {
            if (dmx.getTopic(fileTopicId).getChildTopics().getString(MEDIA_TYPE).startsWith("video/")) {
                File file = fs.getFile(fileTopicId);
                Picture picture = FrameGrab.getFrameAtSec(file, SEEK_IN_SECS);
                BufferedImage image = AWTUtil.toBufferedImage(picture);
                String outPath = replaceExtension(file.getPath(), ".png");
                ImageIO.write(image, "png", new File(outPath));
            }
        } catch (Exception e) {
            throw new RuntimeException("Creating poster frame for file topic " + fileTopicId + " failed", e);
        }
    }

    // ------------------------------------------------------------------------------------------------- Private Methods

    private String replaceExtension(String path, String newExt) {
        return path.substring(0, path.lastIndexOf('.')) + newExt;
    }
}
