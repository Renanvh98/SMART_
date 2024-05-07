

#ifndef DHT22_H_
#define DHT22_H_

#define DHT_OK 0
#define DHT_CHECKSUM_ERROR -1
#define DHT_TIMEOUT_ERROR -2

#define DHT_GPIO 25

void DHT22_task_start(void);
void errorHandler(int response);
float getVoltage();
float getCurrent();
float getPower();
float getTotalEnergy();
float getCustoPorHora();
#endif
