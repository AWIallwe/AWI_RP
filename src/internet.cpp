#include "../src/include/main.hpp"

String serverUrl = "https://jsonplaceholder.typicode.com/posts";
long timerSendTelemetry = 0;

void postTelemetry(void)
{
    StaticJsonDocument<600> doc;
    doc["internalHumidity"] = internalHumidity;
    doc["temperature"] = temperature;
    doc["latitude"] = String(latitude, 6);
    doc["longitude"] = String(longitude, 6);
    doc["CO"] = ppm;
    doc["O3"] = "";  // TODO: Replace this value with the actual reading from your CO sensor
    doc["NO2"] = "";  // TODO: Replace this value with the actual reading from your CO sensor
    doc["PM25"] = "";   // TODO: Replace this value with the actual reading from your CO sensor

    String requestBody;
    serializeJson(doc, requestBody);
    Serial.println(requestBody);

    if (WiFi.status() == WL_CONNECTED)
    {
        HTTPClient http;
        http.begin(serverUrl);
        http.addHeader("Content-Type", "application/json");

        int httpResponseCode = http.POST(requestBody);

        if (httpResponseCode > 0)
        {
            Serial.print("Response code: ");
            Serial.println(httpResponseCode);
            String response = http.getString();
            Serial.println("Server response:");
            Serial.println(response);
        }
        else
        {
            Serial.print("POST error: ");
            Serial.println(httpResponseCode);
        }

        http.end();
    }
}

void sendTelemetry(void)
{
    if (timerSendTelemetry >= 60000)
    {
        postTelemetry();
        timerSendTelemetry = 0;
    }
    timerSendTelemetry += CYCLETIME;
}
