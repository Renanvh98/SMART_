/**
 * Add gobals here
 */
var seconds 	= null;
var otaTimerVar =  null;
var wifiConnectInterval = null;

/**
 * Initialize functions here.
 */
$(document).ready(function(){
	getSSID();
	getUpdateStatus();
	startDHTSensorInterval();
	startLocalTimeInterval();
	getConnectInfo();
	$("#connect_wifi").on("click", function(){
		checkCredentials();
	}); 
	$("#disconnect_wifi").on("click", function(){
		disconnectWifi();
	}); 
});   

/**
 * Gets file name and size for display on the web page.
 */
function getFileInfo() {
    var x = document.getElementById("selected_file");
    var file = x.files[0];

    document.getElementById("file_info").innerHTML = "<h4>File: " + file.name + "<br>" + "Size: " + file.size + " bytes</h4>";
}

/**
 * Handles the firmware update.
 */
function updateFirmware() {
    // Form Data
    var formData = new FormData();
    var fileSelect = document.getElementById("selected_file");

    if (fileSelect.files && fileSelect.files.length == 1) {
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
    else {
        window.alert('Select A File First')
    }
}

/**
 * Progress on transfers from the server to the client (downloads).
 */
function updateProgress(oEvent) {
    if (oEvent.lengthComputable) {
        getUpdateStatus();
    }
    else {
        window.alert('total size is unknown')
    }
}

/**
 * Posts the firmware udpate status.
 */
function getUpdateStatus() {
    var xhr = new XMLHttpRequest();
    var requestURL = "/OTAstatus";
    xhr.open('POST', requestURL, false);
    xhr.send('ota_update_status');

    if (xhr.readyState == 4 && xhr.status == 200) {
        var response = JSON.parse(xhr.responseText);

        document.getElementById("latest_firmware").innerHTML = response.compile_date + " - " + response.compile_time

        // If flashing was complete it will return a 1, else -1
        // A return of 0 is just for information on the Latest Firmware request
        if (response.ota_update_status == 1) {
            // Set the countdown timer time
            seconds = 10;
            // Start the countdown timer
            otaRebootTimer();
        }
        else if (response.ota_update_status == -1) {
            document.getElementById("ota_update_status").innerHTML = "!!! Upload Error !!!";
        }
    }
}

/**
 * Displays the reboot countdown.
 */
function otaRebootTimer() {
    document.getElementById("ota_update_status").innerHTML = "OTA Firmware Update Complete. This page will close shortly, Rebooting in: " + seconds;

    if (--seconds == 0) {
        clearTimeout(otaTimerVar);
        window.location.reload();
    }
    else {
        otaTimerVar = setTimeout(otaRebootTimer, 1000);
    }
}
let totalEnergy = 0;
let totalCost = 0;
let pricePerKWh = 0.75; // Preço por kWh
let elapsedTime = 0; // Tempo decorrido em segundos



function getSimulatedValues() {
    let voltage = (127 + Math.random() * 2 - 1).toFixed(2);  // Entre 126V e 128V
    let current = (0.5 + Math.random() * 1.5).toFixed(2);   // Entre 0.5A e 2A
    let power = (voltage * current).toFixed(2);            // P = V * I
    let energyMoment = ((power * 5) / 3600).toFixed(4);    // Energia consumida nos últimos 5s em kWh
    let humidity = (30 + Math.random() * 20).toFixed(2);   // Entre 30% e 70%
    let temperature = (20 + Math.random() * 2).toFixed(2); // Entre 20°C e 22°C

    // Cálculo do custo momentâneo
    let costMoment = (parseFloat(energyMoment) * pricePerKWh).toFixed(2);

    // Acumulando energia e custo
    totalEnergy += parseFloat(energyMoment);
    totalCost = (totalEnergy * pricePerKWh).toFixed(2);
    elapsedTime += 5;

    if (elapsedTime >= 3600) { // Resetar a cada 1 hora
        totalEnergy = 0;
        totalCost = 0;
        elapsedTime = 0;
    }

    // Atualizando os valores na página
    $("#voltage_reading").text(voltage + " V");
    $("#current_reading").text(current + " A");
    $("#power_reading").text(power + " W");
    $("#total_reading").text(totalEnergy.toFixed(4) + " kWh");
    
    $("#cost_reading").text("R$" + costMoment);  // Custo apenas dos últimos 5s
    $("#cost_accumulated").text("R$" + totalCost); // Custo acumulado na última hora

    $("#humidity_reading").text(humidity + " %");
    $("#temperature_reading").text(temperature + " °C");

    // Atualizando cronômetro
    let remainingTime = 3600 - elapsedTime;
    let minutes = Math.floor(remainingTime / 60);
    let seconds = remainingTime % 60;
    $("#time_remaining").text(`${minutes}m ${seconds}s`);
}

function startSimulation() {
    getSimulatedValues(); // Atualiza ao carregar
    setInterval(getSimulatedValues, 5000); // Atualiza a cada 5s
}

$(document).ready(startSimulation);



function stopWifiConnectStatusInterval()
{
	if (wifiConnectInterval != null)
	{
		clearInterval(wifiConnectInterval);
		wifiConnectInterval = null;
	}
}

/**
 * Gets the WiFi connection status.
 */
function getWifiConnectStatus()
{
	var xhr = new XMLHttpRequest();
	var requestURL = "/wifiConnectStatus";
	xhr.open('POST', requestURL, false);
	xhr.send('wifi_connect_status');
	
	if (xhr.readyState == 4 && xhr.status == 200)
	{
		var response = JSON.parse(xhr.responseText);
		
		document.getElementById("wifi_connect_status").innerHTML = "Connecting...";
		
		if (response.wifi_connect_status == 2)
		{
			document.getElementById("wifi_connect_status").innerHTML = "<h4 class='rd'>Failed to Connect. Please check your AP credentials and compatibility</h4>";
			stopWifiConnectStatusInterval();
		}
		else if (response.wifi_connect_status == 3)
		{
			document.getElementById("wifi_connect_status").innerHTML = "<h4 class='gr'>Connection Success!</h4>";
			stopWifiConnectStatusInterval();
			getConnectInfo();
		}
	}
}

/**
 * Starts the interval for checking the connection status.
 */
function startWifiConnectStatusInterval()
{
	wifiConnectInterval = setInterval(getWifiConnectStatus, 2800);
}

/**
 * Connect WiFi function called using the SSID and password entered into the text fields.
 */
function connectWifi()
{
	// Get the SSID and password
	selectedSSID = $("#connect_ssid").val();
	pwd = $("#connect_pass").val();
	
	$.ajax({
		url: '/wifiConnect.json',
		dataType: 'json',
		method: 'POST',
		cache: false,
		headers: {'my-connect-ssid': selectedSSID, 'my-connect-pwd': pwd},
		data: {'timestamp': Date.now()}
	});
	
	startWifiConnectStatusInterval();
}
function toggleAccessibilityMode() {
    document.body.classList.toggle('accessibility-mode');
}

function toggleContent() {
	var content = document.getElementById('additional-content');
	var button = document.querySelector('.toggle-button');
	if (content.classList.contains('hidden')) {
		content.classList.remove('hidden');
		button.textContent = 'Mostrar Menos';
	} else {
		content.classList.add('hidden');
		button.textContent = 'Mostrar Mais';
	}
}
/**
 * Checks credentials on connect_wifi button click.
 */
function checkCredentials()
{
	errorList = "";
	credsOk = true;
	
	selectedSSID = $("#connect_ssid").val();
	pwd = $("#connect_pass").val();
	
	
	if (selectedSSID == "")
	{
		errorList += "<h4 class='rd'>SSID cannot be empty!</h4>";
		credsOk = false;
	}
	if (pwd == "")
	{
		errorList += "<h4 class='rd'>Password cannot be empty!</h4>";
		credsOk = false;
	}
	
	if (credsOk == false)
	{
		$("#wifi_connect_credentials_errors").html(errorList);
	}
	else
	{
		$("#wifi_connect_credentials_errors").html("");
		connectWifi();    
	}
}
/**
 * Shows the WiFi password if the box is checked.
 */
function showPassword()
{
	var x = document.getElementById("connect_pass");
	if (x.type === "password")
	{
		x.type = "text";
	}
	else
	{
		x.type = "password";
	}
}
function getConnectInfo()
{
	$.getJSON('/wifiConnectInfo.json', function(data)
	{
		$("#connected_ap_label").html("Connected to: ");
		$("#connected_ap").text(data["ap"]);
		
		$("#ip_address_label").html("IP Address: ");
		$("#wifi_connect_ip").text(data["ip"]);
		
		$("#netmask_label").html("Netmask: ");
		$("#wifi_connect_netmask").text(data["netmask"]);
		
		$("#gateway_label").html("Gateway: ");
		$("#wifi_connect_gw").text(data["gw"]);
		
		document.getElementById('disconnect_wifi').style.display = 'block';
	});
}

function disconnectWifi()
{
	$.ajax({
		url: '/wifiDisconnect.json',
		dataType: 'json',
		method: 'DELETE',
		cache: false,
		data: { 'timestamp': Date.now() }
	});
	// Update the web page
	setTimeout("location.reload(true);", 2000);
}

/**
 * Sets the interval for displaying local time.
 */
function startLocalTimeInterval()
{
	setInterval(getLocalTime, 10000);
}

/**
 * Gets the local time.
 * @note connect the ESP32 to the internet and the time will be updated.
 */
function getLocalTime()
{
	$.getJSON('/localTime.json', function(data) {
		$("#local_time").text(data["time"]);
	});
}

/**
 * Gets the ESP32's access point SSID for displaying on the web page.
 */
function getSSID() {
    $.getJSON('/apSSID.json', function(data) {
        // Codifica o SSID usando encodeURIComponent

        // Atribui o SSID codificado ao elemento #ap_ssid
        $("#ap_ssid").text(ssid);
    });
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






























