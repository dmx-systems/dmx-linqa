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



class ImageScaler {

    // ------------------------------------------------------------------------------------------------------- Constants

    final float MAX_PIXEL = 1024f;

    // ---------------------------------------------------------------------------------------------- Instance Variables

    private Logger logger = Logger.getLogger(getClass().getName());

    // ----------------------------------------------------------------------------------------- Package Private Methods

    UploadedFile scale(UploadedFile imageFile) {
        try {
            imageFile.setBuffered();    // storing the original (unscaled) image requires re-reading the input stream
            InputStream in = imageFile.getInputStream();
            BufferedImage image = ImageIO.read(in);
            int width = image.getWidth();
            int height = image.getHeight();
            int max = Math.max(width, height);
            if (max <= MAX_PIXEL) {
                logger.info("Size " + width + "x" + height + " (no scaling needed)");
                in.reset();
                return imageFile;
            }
            float scale = MAX_PIXEL / max;
            int targetWidth = (int) (width * scale);
            int targetHeight = (int) (height * scale);
            logger.info("Original " + width + "x" + height + " -> " + targetWidth + "x" + targetHeight + " (scale=" +
                scale + ")");
            BufferedImage scaledImage = createScaledImage(image, targetWidth, targetHeight);
            return outputImage(scaledImage, imageFile.getName());
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

    private UploadedFile outputImage(BufferedImage image, String fileName) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream() {
                @Override
                public synchronized byte[] toByteArray() {
                    return this.buf;
                }
            };
            String format = JavaUtils.getExtension(fileName);
            ImageIO.write(image, format, out);
            int size = out.size();
            InputStream in = new ByteArrayInputStream(out.toByteArray(), 0, size);
            return new UploadedFile(fileName, size, in);
        } catch (Exception e) {
            throw new RuntimeException("Output image failed", e);
        }
    }
}
