/**
 * Add gobals here
 */
var seconds 	= null;
var otaTimerVar =  null;

/**
 * Initialize functions here.
 */
$(document).ready(function(){
	getUpdateStatus();
	startDHTSensorInterval();
});   

/**
 * Gets file name and size for display on the web page.
 */        
function getFileInfo() 
{
    var x = document.getElementById("selected_file");
    var file = x.files[0];

    document.getElementById("file_info").innerHTML = "<h4>File: " + file.name + "<br>" + "Size: " + file.size + " bytes</h4>";
}

/**
 * Handles the firmware update.
 */
function updateFirmware() 
{
    // Form Data
    var formData = new FormData();
    var fileSelect = document.getElementById("selected_file");
    
    if (fileSelect.files && fileSelect.files.length == 1) 
	{
        var file = fileSelect.files[0];
        formData.set("file", file, file.name);
        document.getElementById("ota_update_status").innerHTML = "Uploading " + file.name + ", Firmware Update in Progress...";

        // Http Request
        var request = new XMLHttpRequest();

        request.upload.addEventListener("progress", updateProgress);
        request.open('POST', "/OTAupdate");
        request.responseType = "blob";
        request.send(formData);
    } 
	else 
	{
        window.alert('Select A File First')
    }
}

/**
 * Progress on transfers from the server to the client (downloads).
 */
function updateProgress(oEvent) 
{
    if (oEvent.lengthComputable) 
	{
        getUpdateStatus();
    } 
	else 
	{
        window.alert('total size is unknown')
    }
}

/**
 * Posts the firmware udpate status.
 */
function getUpdateStatus() 
{
    var xhr = new XMLHttpRequest();
    var requestURL = "/OTAstatus";
    xhr.open('POST', requestURL, false);
    xhr.send('ota_update_status');

    if (xhr.readyState == 4 && xhr.status == 200) 
	{		
        var response = JSON.parse(xhr.responseText);
						
	 	document.getElementById("latest_firmware").innerHTML = response.compile_date + " - " + response.compile_time

		// If flashing was complete it will return a 1, else -1
		// A return of 0 is just for information on the Latest Firmware request
        if (response.ota_update_status == 1) 
		{
    		// Set the countdown timer time
            seconds = 10;
            // Start the countdown timer
            otaRebootTimer();
        } 
        else if (response.ota_update_status == -1)
		{
            document.getElementById("ota_update_status").innerHTML = "!!! Upload Error !!!";
        }
    }
}

/**
 * Displays the reboot countdown.
 */
function otaRebootTimer() 
{	
    document.getElementById("ota_update_status").innerHTML = "OTA Firmware Update Complete. This page will close shortly, Rebooting in: " + seconds;

    if (--seconds == 0) 
	{
        clearTimeout(otaTimerVar);
        window.location.reload();
    } 
	else 
	{
        otaTimerVar = setTimeout(otaRebootTimer, 1000);
    }
}
function atualizarBarras() {
    // Obter os elementos das barras
    const voltageBar = document.getElementById("voltage_bar");
    const currentBar = document.getElementById("current_bar");
    const powerBar = document.getElementById("power_bar");

    // Obter os valores de tensão, corrente e potência
    const tensao = parseInt(document.getElementById("voltage_reading").innerText);
    const corrente = parseFloat(document.getElementById("current_reading").innerText);
    const potencia = parseInt(document.getElementById("power_reading").innerText);

    // Atualizar a largura das barras com base nos valores
    voltageBar.style.width = ((tensao - 90) / (240 - 90)) * 100 + "%";
    currentBar.style.width = ((corrente - 0.1) / (15 - 0.1)) * 100 + "%";
    powerBar.style.width = ((potencia - 0) / (1000 - 0)) * 100 + "%"; // Supondo que a potência varie de 0 a 1000
}

// Chamando a função ao carregar a página
window.onload = function () {
    atualizarBarras();
};
/**
 * Gets DHT22 sensor temperature and humidity values for display on the web page.
 */
function getDHTSensorValues() {
    $.getJSON('/dhtSensor.json', function(data) {
        $("#voltage_reading").text(data["voltage"] + " V");
        $("#current_reading").text(data["current"] + " A");

        // Calcula a potência (em watts) usando a fórmula P = V * I
        var power = parseFloat(data["voltage"]) * parseFloat(data["current"]);

        // Exibe a potência arredondada para duas casas decimais, junto com a unidade "W"
        $("#power_reading").text(power.toFixed(2) + " W");

        // Suponha que o tempo de funcionamento seja de 1 hora para simplificar o exemplo
        var timeInHours = 1;

        // Calcula a energia em watts-hora (Wh)
        var energyInWh = power * timeInHours;

        // Converte a energia de watts-hora para quilowatt-hora (kWh)
        var energyInkWh = energyInWh / 1000;

        // Exibe a energia consumida arredondada para duas casas decimais, junto com a unidade "kWh"
        $("#energy_reading").text(energyInkWh.toFixed(2) + " kWh");

        // Suponha que a tarifa da bandeira verde seja de R$ 0,50 por kWh
        var tariff = 0.50;

        // Calcula o custo por hora em reais
        var costPerHour = energyInkWh * tariff;

        // Exibe o custo por hora arredondado para duas casas decimais, junto com a unidade "R$"
        $("#cost_per_hour").text("R$ " + costPerHour.toFixed(2));
    });
}

/**
 * Sets the interval for getting the updated DHT22 sensor values.
 */
function startDHTSensorInterval()
{
	setInterval(getDHTSensorValues, 1000);
}
function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;
    document.getElementById('clock').textContent = timeString;
}

setInterval(updateClock, 1000);





























