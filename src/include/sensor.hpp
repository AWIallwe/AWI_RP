#ifndef SENSOR_HPP
#define SENSOR_HPP

extern float latitude;
extern float longitude;
extern float ppm;

void readGPSData();
void readHumiditySensor();
void readMQ7();

#endif