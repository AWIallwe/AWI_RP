#include "../src/include/main.hpp"

unsigned long lastDhtRead = 0;
const unsigned long dhtInterval = 5000;
float internalHumidity = 0;
float temperature = 0;
static int failures = 0;
float latitude = -20.839131186912063;
float longitude = -49.421997877668446;

const float RL = 10000.0;
const float VCC = 2.8;
const float m = -0.77;
const float b = 0.22;
float Ro = 10000;
unsigned long lastChange = 0;
bool highTemp = true;
long timerSendReadSensor = 0;
float ppm = 0.0;

float readRs()
{
    int adc = analogRead(MQ7_PIN);
    float Vout = adc * (VCC / 4095.0);
    float Rs = RL * ((VCC / Vout) - 1.0);
    return Rs;
}

float getPPM(float Rs)
{
    float ratio = Rs / Ro;
    float ppm = pow(10, (log10(ratio) - b) / m);
    return ppm;
}

void readGPSData()
{
    while (gpsSerial.available() > 0)
    {
        if (gps.encode(gpsSerial.read()))
        {
            if (gps.location.isUpdated())
            {
                Serial.println(F("--- New Position Fix ---"));

                Serial.print(F("Latitude: "));
                Serial.print(gps.location.lat(), 6);
                latitude = gps.location.lat();
                Serial.print(F(" | Longitude: "));
                Serial.println(gps.location.lng(), 6);
                longitude = gps.location.lng();

                if (gps.date.isValid() && gps.time.isValid())
                {
                    Serial.print(F("Date (DD/MM/YYYY): "));
                    if (gps.date.day() < 10)
                        Serial.print(F("0"));
                    Serial.print(gps.date.day());
                    Serial.print(F("/"));
                    if (gps.date.month() < 10)
                        Serial.print(F("0"));
                    Serial.print(gps.date.month());
                    Serial.print(F("/"));
                    Serial.print(gps.date.year());

                    Serial.print(F(" | Time (UTC): "));
                    if (gps.time.hour() < 10)
                        Serial.print(F("0"));
                    Serial.print(gps.time.hour());
                    Serial.print(F(":"));
                    if (gps.time.minute() < 10)
                        Serial.print(F("0"));
                    Serial.print(gps.time.minute());
                    Serial.print(F(":"));
                    if (gps.time.second() < 10)
                        Serial.print(F("0"));
                    Serial.print(gps.time.second());
                    Serial.println();
                }
                else
                {
                    Serial.println(F("Date/Time: INVALID"));
                }

                Serial.print(F("Satellites: "));
                Serial.println(gps.satellites.value());

                Serial.println(F("--------------------------------"));
            }
        }
    }

    if (millis() > 5000 && gps.charsProcessed() < 10)
    {
        Serial.println(F("Error: No GPS data. Check connections (RX/TX/Power) and antenna."));
    }
}

void readHumiditySensor()
{
    unsigned long now = millis();
    if (now - lastDhtRead >= dhtInterval)
    {
        lastDhtRead = now;
        float h = dht.getHumidity();
        float t = dht.getTemperature();

        if (!isnan(h) && !isnan(t))
        {
            internalHumidity = h;
            temperature = t;
            Serial.print("Humidity: ");
            Serial.println(internalHumidity);
            Serial.print("Temperature: ");
            Serial.println(temperature);
        }
        else
        {
            failures++;
            Serial.println("⚠️ Failed to read DHT22");
            if (failures > 5)
            {
                Serial.println("🔄 Restarting DHT...");
                dht.setup(DHT_PIN, DHTesp::DHT22);
                failures = 0;
            }
        }
    }
}

void readMQ7()
{
    if (timerSendReadSensor >= 5000)
    {
        float Rs = readRs();
        ppm = getPPM(Rs);

        Serial.print("Rs: ");
        Serial.print(Rs, 1);
        Serial.print(" | Approx. CO: ");
        Serial.print(ppm, 8);
        Serial.println(" ppm");
        timerSendReadSensor = 0;
    };
    timerSendReadSensor += CYCLETIME;
}