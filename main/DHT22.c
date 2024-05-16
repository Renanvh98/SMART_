

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
#include <esp_adc_cal.h>


static const char *TAG = "DHT";
#define DEFAULT_VREF 1100 // Tensão de referência padrão do ADC (mV)
float totalEnergy = 0.0f; // Variável global para rastrear a energia total consumida
static esp_adc_cal_characteristics_t *adc_chars;

float getVoltage()
{
	// Configuração do ADC
	adc1_config_width(ADC_WIDTH_BIT_12);
	adc1_config_channel_atten(ADC1_CHANNEL_7, ADC_ATTEN_DB_12); // Usando ADC_ATTEN_DB_12 como exemplo de atenuação

	// Caracterização do ADC
	adc_chars = calloc(1, sizeof(esp_adc_cal_characteristics_t));
	esp_adc_cal_characterize(ADC_UNIT_1, ADC_ATTEN_DB_12, ADC_WIDTH_BIT_12, DEFAULT_VREF, adc_chars);

	uint32_t adc_reading = 0;
	float sum = 0.0;
	float peak_voltage = 0.0;
	const int sample_count = 500; // Número de amostras para a média
	const float gain = 0.0028;	  // Ganho do sensor

	// Realiza a leitura durante 500ms e calcula a média e o pico
	for (int i = 0; i < sample_count; i++)
	{
		adc_reading = adc1_get_raw(ADC1_CHANNEL_7);
		float voltage = esp_adc_cal_raw_to_voltage(adc_reading, adc_chars) / 1000.0; // Convertendo para volts
		sum += voltage;

		if (voltage > peak_voltage)
		{
			peak_voltage = voltage;
		}

		vTaskDelay(pdMS_TO_TICKS(1)); // Espera 1ms entre as leituras
	}

	float average_voltage = sum / sample_count;
	float peak_minus_average = peak_voltage - average_voltage;
	float v_rms = peak_voltage / sqrt(2);

	// Calcula o valor final
	float result1 = peak_minus_average / gain / v_rms;

	if (result1 < 90)
	{
		return result1 = 0;
	}
	else
	{
		return result1;
	}
}
float getCurrent()
{
	// Configuração do ADC
	adc1_config_width(ADC_WIDTH_BIT_12);
	adc1_config_channel_atten(ADC1_CHANNEL_6, ADC_ATTEN_DB_12); // Usando ADC_ATTEN_DB_12 como exemplo de atenuação

	// Caracterização do ADC
	adc_chars = calloc(1, sizeof(esp_adc_cal_characteristics_t));
	esp_adc_cal_characterize(ADC_UNIT_1, ADC_ATTEN_DB_12, ADC_WIDTH_BIT_12, DEFAULT_VREF, adc_chars);

	uint32_t adc_reading = 0;
	float sum = 0.0;
	float peak_current = 0.0;
	const int sample_count = 500;	 // Número de amostras para a média
	const float sensitivity = 0.22; // Sensibilidade do ACS712 de 185mV/A

	// Realiza a leitura durante 500ms e calcula a média e o pico
	for (int i = 0; i < sample_count; i++)
	{
		adc_reading = adc1_get_raw(ADC1_CHANNEL_6);
		float voltage = esp_adc_cal_raw_to_voltage(adc_reading, adc_chars) / 1000.0; // Convertendo para volts
		float current = voltage / sensitivity;										 // Convertendo para corrente usando a sensibilidade do ACS712
		sum += current;

		if (current > peak_current)
		{
			peak_current = current;
		}

		vTaskDelay(pdMS_TO_TICKS(1)); // Espera 1ms entre as leituras
	}

	float average_current = sum / sample_count;
	float peak_minus_average = peak_current - average_current;
	float result = peak_minus_average;

	return result;
}
float getPower()
{
	float voltage = getVoltage();
	float current = getCurrent();
	float power = voltage * current;

	totalEnergy += power; // Somando a energia instantânea à energia total consumida

	return power;
}
float getTotalEnergy()
{
	return totalEnergy;
}
float custoPorKWh = 0.5;
float getCustoPorHora()
{
	float energiaTotal = getTotalEnergy();			 // Obtendo a energia total consumida
	float power = getPower();					 // Obtendo a potência do dispositivo em watts
	float energiaPorHora = energiaTotal / (60 * 60); // Convertendo para kWh
	float custoPorHora = energiaPorHora * custoPorKWh;
	return custoPorHora;
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
	printf("Leitura de Tensão e Corrente\n\n");

	for (;;)
	{
		printf("Leitura Tensão e Corrente\n");

		printf("Tensão: %.4f\n", getVoltage());
		printf("Corrente: %.4f\n", getCurrent());
		printf("Potência: %.4f\n", getPower());
		printf("Total de Energia: %.4f\n", getTotalEnergy());
		printf("Custo por hora: %.4f\n", getCustoPorHora());

		printf("Heap: %u\n", (unsigned int)esp_get_free_heap_size());
		vTaskDelay(4000 / portTICK_PERIOD_MS);
	}
}

void DHT22_task_start(void)
{
	xTaskCreatePinnedToCore(&DHT22_task, "DHT22_task", DTH22_TASK_STACK_SIZE, NULL, DTH22_TASK_PRIORITY, NULL, DTH22_TASK_CORE_ID);
}
