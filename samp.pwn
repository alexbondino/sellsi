#include <a_samp>

#define COLOR_BLANCO 0xFFFFFFFF
#define COLOR_VERDE  0x33FF33FF
#define COLOR_ROJO   0xFF3333FF

new TimerMensaje;

// ======================
// INICIO DEL SERVIDOR
// ======================
public OnGameModeInit()
{
    SetGameModeText("Servidor Basico Pawn");
    AddPlayerClass(0, 1958.3783,1343.1572,15.3746,269.3145, 0,0,0,0,0,0);

    print("=================================");
    print("  Servidor SA-MP iniciado");
    print("=================================");

    TimerMensaje = SetTimer("MensajeGlobal", 60000, true);
    return 1;
}

// ======================
// APAGADO DEL SERVIDOR
// ======================
public OnGameModeExit()
{
    KillTimer(TimerMensaje);
    print("Servidor apagado");
    return 1;
}

// ======================
// JUGADOR CONECTA
// ======================
public OnPlayerConnect(playerid)
{
    new nombre[MAX_PLAYER_NAME];
    GetPlayerName(playerid, nombre, sizeof(nombre));

    new mensaje[64];
    format(mensaje, sizeof(mensaje), "%s se ha conectado.", nombre);
    SendClientMessageToAll(COLOR_VERDE, mensaje);

    SendClientMessage(playerid, COLOR_BLANCO, "Bienvenido al servidor basico.");
    return 1;
}

// ======================
// JUGADOR DESCONECTA
// ======================
public OnPlayerDisconnect(playerid, reason)
{
    new nombre[MAX_PLAYER_NAME];
    GetPlayerName(playerid, nombre, sizeof(nombre));

    new mensaje[64];
    format(mensaje, sizeof(mensaje), "%s se ha desconectado.", nombre);
    SendClientMessageToAll(COLOR_ROJO, mensaje);
    return 1;
}

// ======================
// JUGADOR SPAWN
// ======================
public OnPlayerSpawn(playerid)
{
    SetPlayerHealth(playerid, 100.0);
    GivePlayerMoney(playerid, 500);
    SendClientMessage(playerid, COLOR_VERDE, "Has spawneado con vida completa y $500.");
    return 1;
}

// ======================
// COMANDOS
// ======================
public OnPlayerCommandText(playerid, cmdtext[])
{
    if (strcmp(cmdtext, "/hola", true) == 0)
    {
        SendClientMessage(playerid, COLOR_BLANCO, "Hola, este es un servidor de prueba.");
        return 1;
    }

    if (strcmp(cmdtext, "/vida", true) == 0)
    {
        SetPlayerHealth(playerid, 100.0);
        SendClientMessage(playerid, COLOR_VERDE, "Tu vida fue restaurada.");
        return 1;
    }

    return 0;
}

// ======================
// TIMER GLOBAL
// ======================
forward MensajeGlobal();
public MensajeGlobal()
{
    SendClientMessageToAll(COLOR_BLANCO, "Recuerda divertirte en el servidor.");
    return 1;
}
