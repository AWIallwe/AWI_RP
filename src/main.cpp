#include "../src/include/main.hpp"

HardwareSerial gpsSerial(2);
DHTesp dht;
WiFiManager wifiManager;
TinyGPSPlus gps;

void setup()
{
    Serial.begin(115200);

    Serial.println("Connecting...");
    if (!wifiManager.autoConnect("AWI", "123456789"))
    {
        Serial.println("Failed to connect, restarting...");
        wifiManager.resetSettings();
        delay(1000);
        ESP.restart();
    }

    dht.setup(DHT_PIN, DHTesp::DHT22);
    gpsSerial.begin(GPS_BAUD, SERIAL_8N1, RXD2, TXD2);
    pinMode(MQ7_PIN, INPUT);
}

void loop()
{
    readHumiditySensor();
    readGPSData();
    readMQ7();
    sendTelemetry();
    delay(CYCLETIME);
}