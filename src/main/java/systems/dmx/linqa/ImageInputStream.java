package systems.dmx.linqa;

import systems.dmx.files.UploadedFile;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.IOException;
import javax.imageio.ImageIO;



/**
 * An InputStream providing the encoded data of a BufferedImage.
 * It also holds a) the size (in bytes) of the encoded image, and b) an optional filename.
 */
class ImageInputStream {

    // ---------------------------------------------------------------------------------------------- Instance Variables

    private BufferedImage image;
    private String format;
    private String filename;

    // ---------------------------------------------------------------------------------------------------- Constructors

    ImageInputStream(BufferedImage image, String format) {
        this(image, format, null);
    }

    /**
     * @param   filename    optional: a filename (no path information). The given string is available in the
     *                      UploadedFile object returned by get() then.
     */
    ImageInputStream(BufferedImage image, String format, String filename) {
        this.image = image;
        this.format = format;
        this.filename = filename;
    }

    // ----------------------------------------------------------------------------------------- Package Private Methods

    /**
     * Encodes the image according to the given format.
     */
    UploadedFile get() throws IOException {
        // https://stackoverflow.com/questions/4251383/how-to-convert-bufferedimage-to-inputstream/
        ByteArrayOutputStream out = new ByteArrayOutputStream() {
            @Override
            public synchronized byte[] toByteArray() {
                return this.buf;
            }
        };
        ImageIO.write(image, format, out);
        int size = out.size();
        InputStream in = new ByteArrayInputStream(out.toByteArray(), 0, size);
        return new UploadedFile(filename, size, in);
    }
}
