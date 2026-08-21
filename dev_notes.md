# Xtein Web


## Como levantar el proyecto
1. Clonar repo por metodo https
2. Ejecutar: ´npm install´
3. Levantar app: ´npm start o ng serve´

## Prerrequisitos
- NodeJs version (v20.19.4)
- Angular CLI version (15.2.11)

## Problemas que encontre
  * Problemas de ejecucion con el powerShell
    1. Ejecutas como administrador tu powerShell este comando, Get-ExecutionPolicy -List
    2. Luego te ubicas en LocalMachine con el comando, Get-ExecutionPolicy -Scope LocalMachine
    3. Despues ejecutas el siguiente comando para cambiar la policy de localMachine, Set-ExecutionPolicy -ExecutionPolicy Unrestricted
    4. Volver a ejecutar el comando del paso 1 y verificar el cambio de policy en LocalMachine

  * Problemas con instalacion de los node_modules
    1. Ejecutas npm install --force (obligatorio por las dependencias de las librerias)

  *  

