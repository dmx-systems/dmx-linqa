package systems.dmx.linqa;

@FunctionalInterface
interface StringProvider {
    String getString(String lang, String key, Object... args);
}
