#define OTA_UPDATE_PENDING 0
#define OTA_UPDATE_SUCCESSFUL 1
#define OTA_UPDATE_FAILED -1


typedef enum http_server_wifi_connect_status
{
    NONE = 0,
    HTTP_WIFI_STATUS_CONNECTING,
    HTTP_WIFI_STATUS_CONNECT_FAILED,
    HTTP_WIFI_STATUS_CONNECT_SUCCESS,
} http_server_wifi_connect_status_e;


typedef enum http_server_message
{
    HTTP_MSG_WIFI_CONNECT_INIT = 0,
    HTTP_MSG_WIFI_CONNECT_SUCCESS,
    HTTP_MSG_WIFI_CONNECT_FAIL,
    HTTP_MSG_OTA_UPDATE_SUCCESSFUL,
    HTTP_MSG_OTA_UPDATE_FAILED,
} http_server_message_e;


typedef struct http_server_queue_message
{
    http_server_message_e msgID;
} http_server_queue_message_t;

/**
 * 
 * @param msgID 
 * @return 
 * @note 
 */
BaseType_t http_server_monitor_send_message(http_server_message_e msgID);

void http_server_start(void);

void http_server_stop(void);

void http_server_fw_update_reset_callback(void *arg);
