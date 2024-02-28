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
            InputStream in = imageFile.getInputStream();
            String name = imageFile.getName();
            String format = JavaUtils.getExtension(name);
            BufferedImage image = ImageIO.read(in);
            int width = image.getWidth();
            int height = image.getHeight();
            int max = Math.max(width, height);
            if (max > MAX_PIXEL) {
                float scale = MAX_PIXEL / max;
                int targetWidth = (int) (width * scale);
                int targetHeight = (int) (height * scale);
                logger.info("Original " + width + "x" + height + " -> " + targetWidth + "x" + targetHeight + "(scale=" +
                    scale + ")");
                // FIXME: use TYPE_INT_ARGB?
                BufferedImage scaledImage = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
                Graphics2D g = scaledImage.createGraphics();
                g.drawImage(image, 0, 0, targetWidth, targetHeight, null);     // observer=null
                g.dispose();
                image = scaledImage;
            } else {
                logger.info("Size " + width + "x" + height + " (no scaling needed)");
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream() {
                @Override
                public synchronized byte[] toByteArray() {
                    return this.buf;
                }
            };
            ImageIO.write(image, format, out);
            int size = out.size();
            InputStream scaledIn = new ByteArrayInputStream(out.toByteArray(), 0, size);
            return new UploadedFile(name, size, scaledIn);
        } catch (Exception e) {
            throw new RuntimeException("Storing scaled image failed", e);
        }
    }

    // ------------------------------------------------------------------------------------------------- Private Methods
}
