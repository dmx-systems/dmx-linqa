package systems.dmx.linqa;

import systems.dmx.core.util.JavaUtils;
import systems.dmx.files.UploadedFile;

import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.logging.Logger;
import javax.imageio.ImageIO;



public class ImageScaler {

    // ------------------------------------------------------------------------------------------------------- Constants

    private static final int MAX_IMAGE_SIZE = 1024;  // max dimension in pixel

    // ---------------------------------------------------------------------------------------------- Instance Variables

    private Logger logger = Logger.getLogger(getClass().getName());

    // ----------------------------------------------------------------------------------------- Package Private Methods

    /**
     * @return  the scaled image or null if no scaling was needed.

     * @throws  RuntimeException    if the original image data could not be decoded.
     */
    public UploadedFile scale(UploadedFile originalImage) {
        try {
            originalImage.setBuffered();               // storing the original image requires re-reading the input stream
            InputStream in = originalImage.getInputStream();
            BufferedImage image = ImageIO.read(in);    // throws IOException
            if (image == null) {
                throw new RuntimeException("Original image could not be read");
            }
            in.reset();                                // throws IOException
            int width = image.getWidth();
            int height = image.getHeight();
            int max = Math.max(width, height);
            if (max <= MAX_IMAGE_SIZE) {
                logger.info("Size " + width + "x" + height + " (no scaling needed)");
                return null;
            }
            float scale = MAX_IMAGE_SIZE / (float) max;
            int targetWidth = (int) (width * scale);
            int targetHeight = (int) (height * scale);
            logger.info("Original " + width + "x" + height + " -> " + targetWidth + "x" + targetHeight + " (scale=" +
                scale + ")");
            BufferedImage scaledImage = createScaledImage(image, targetWidth, targetHeight);
            return outputScaledImage(scaledImage, originalImage.getName());
        } catch (Exception e) {
            throw new RuntimeException("ImageScaler failed", e);
        }
    }

    // ------------------------------------------------------------------------------------------------- Private Methods

    private BufferedImage createScaledImage(BufferedImage image, int width, int height) {
        // FIXME: use TYPE_INT_ARGB?
        BufferedImage scaledImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = scaledImage.createGraphics();
        g.drawImage(image, 0, 0, width, height, null);     // observer=null
        g.dispose();
        return scaledImage;
    }

    private UploadedFile outputScaledImage(BufferedImage image, String fileName) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream() {
                @Override
                public synchronized byte[] toByteArray() {
                    return this.buf;
                }
            };
            String basename = JavaUtils.getBasename(fileName);
            String format = JavaUtils.getExtension(fileName);
            String scaledFilename = basename + "-" + MAX_IMAGE_SIZE + "." + format;
            ImageIO.write(image, format, out);
            int size = out.size();
            InputStream in = new ByteArrayInputStream(out.toByteArray(), 0, size);
            return new UploadedFile(scaledFilename, size, in);
        } catch (Exception e) {
            throw new RuntimeException("Output image failed", e);
        }
    }
}
