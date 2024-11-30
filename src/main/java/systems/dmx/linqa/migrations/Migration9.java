package systems.dmx.linqa.migrations;

import static systems.dmx.files.Constants.*;
import static systems.dmx.linqa.Constants.*;
import systems.dmx.linqa.VideoFrameGrabber;

import systems.dmx.core.Topic;
import systems.dmx.core.service.Inject;
import systems.dmx.core.service.Migration;
import systems.dmx.files.FilesService;

import java.util.logging.Logger;



/**
 * Creates poster frame PNGs for existing video Documents.
 * <p>
 * Part of Linqa 2.0
 * Runs only in UPDATE mode.
 */
public class Migration9 extends Migration {

    // ---------------------------------------------------------------------------------------------- Instance Variables

    @Inject
    private FilesService fs;

    private int docs = 0;
    private int files = 0;
    private int videos = 0;
    private int posterframes = 0;
    private int errors = 0;

    private Logger logger = Logger.getLogger(getClass().getName());

    // -------------------------------------------------------------------------------------------------- Public Methods

    @Override
    public void run() {
        logger.info("##### Migration 9: Creating video poster frames ...");
        dmx.getTopicsByType(DOCUMENT).stream().forEach(doc -> {
            docs++;
            Topic file1 = doc.getChildTopics().getTopicOrNull(FILE + "#" + LANG1);
            Topic file2 = doc.getChildTopics().getTopicOrNull(FILE + "#" + LANG2);
            createPosterFrame(file1);
            createPosterFrame(file2);
        });
        logger.info(String.format("### Video poster frame migration complete\n  Documents: %d\n  Files: %d\n  " +
            "Videos: %d\n  Poster frames created: %d\n  Errors: %d", docs, files, videos, posterframes, errors));
    }

    // ------------------------------------------------------------------------------------------------- Private Methods

    private void createPosterFrame(Topic file) {
        try {
            if (file != null) {
                files++;
                if (new VideoFrameGrabber(dmx, fs).createPosterFrame(file)) {
                    videos++;
                    posterframes++;
                }
            }
        } catch (Exception e) {
            videos++;   // also an erroneous video is a video
            errors++;
            logger.warning(e + ", cause: " + e.getCause());
        }
    }
}
