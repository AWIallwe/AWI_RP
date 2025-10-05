#ifndef MAIN_HPP
#define MAIN_HPP

#include <WiFi.h>
#include <SPIFFS.h>
#include <ArduinoJson.h>
#include "DHTesp.h"
#include <WiFiManager.h>
#include <TinyGPSPlus.h>
#include <HTTPClient.h>
#include "internet.hpp"
#include "sensor.hpp"

extern float internalHumidity;
extern float temperature;

extern HardwareSerial gpsSerial;
extern DHTesp dht;
extern WiFiManager wifiManager;
extern TinyGPSPlus gps;

#define DHT_PIN 4
#define RXD2 16
#define TXD2 17
#define GPS_BAUD 9600
#define CYCLETIME 10
#define MQ7_PIN 32

#endif