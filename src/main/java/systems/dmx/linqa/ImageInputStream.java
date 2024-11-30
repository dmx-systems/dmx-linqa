package systems.dmx.linqa;

import systems.dmx.files.UploadedFile;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.IOException;
import javax.imageio.ImageIO;



class ImageInputStream {

    // ---------------------------------------------------------------------------------------------- Instance Variables

    private BufferedImage image;
    private String format;
    private String filename;

    // ---------------------------------------------------------------------------------------------------- Constructors

    /**
     * @param   filename    a sole filename, no path information
     */
    ImageInputStream(BufferedImage image, String format, String filename) {
        this.image = image;
        this.format = format;
        this.filename = filename;
    }

    // ----------------------------------------------------------------------------------------- Package Private Methods

    UploadedFile get() throws IOException {
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
