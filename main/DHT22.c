

#define LOG_LOCAL_LEVEL ESP_LOG_VERBOSE
#include <math.h>
#include <stdio.h>
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_system.h"
#include "driver/gpio.h"
#include "driver/adc.h"
#include "DHT22.h"
#include "tasks_common.h"
static const char *TAG = "DHT";
#define GANHO_ACS712 0.100		 // Ganho do sensor ACS712 (depende da versão do sensor)
#define TENSÃO_DE_REFERÊNCIA 3.3 // Tensão de referência em milivolts (3.3V)
#define TENSÃO_DE_DESCONTO 250.0
// == global defines =============================================

// const int = adc1_get_raw(ADC_CHANNEL_5);
float corrente;
double potencia;
float tensao;
float tensaodc;
float correntedc;

float getVoltage1()
{
	tensaodc = (adc1_get_raw(ADC_CHANNEL_7) / 4095.0 * TENSÃO_DE_REFERÊNCIA);
	tensao = tensaodc * 0.100;
	return tensao;
	
}
float getVoltage()
{
    float sumSquare = 0.0;
    int numSamples = 1000; // Número de amostras para calcular a média
    float rmsVoltage;

    for (int i = 0; i < numSamples; i++)
    {
        float voltage = getVoltage1();
        sumSquare += voltage * voltage;
    }

    float meanSquare = sumSquare / numSamples;
    rmsVoltage = sqrt(meanSquare);

    return rmsVoltage;
}

float getCurrent()
{
	correntedc = (adc1_get_raw(ADC_CHANNEL_6) / 4095.0 * TENSÃO_DE_REFERÊNCIA);
	corrente = correntedc * 0.100;
	return corrente;
}
void errorHandler(int response)
{
	switch (response)
	{

	case DHT_TIMEOUT_ERROR:
		ESP_LOGE(TAG, "Sensor Timeout\n");
		break;

	case DHT_CHECKSUM_ERROR:
		ESP_LOGE(TAG, "CheckSum error\n");
		break;

	case DHT_OK:
		break;

	default:
		ESP_LOGE(TAG, "Unknown error\n");
	}
}

#define MAXdhtData 5

static void DHT22_task(void *pvParameter)
{
	printf("Starting DHT task\n\n");

	for (;;)
	{
		printf("Leitura Tensão e Corrente\n");

		printf("Vol %.4f\n", getVoltage());
		printf("Cur %.4f\n", getCurrent());
		vTaskDelay(4000 / portTICK_PERIOD_MS);
	}
}

void DHT22_task_start(void)
{
	xTaskCreatePinnedToCore(&DHT22_task, "DHT22_task", DTH22_TASK_STACK_SIZE, NULL, DTH22_TASK_PRIORITY, NULL, DTH22_TASK_CORE_ID);
}
