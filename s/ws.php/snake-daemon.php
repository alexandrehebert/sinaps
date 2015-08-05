<?php

require 'vendor/autoload.php';

use Ratchet\Server\IoServer;
use Ratchet\WebSocket\WsServer;
use Snake\Server;

$server = IoServer::factory(
    new WsServer(
        new Server()
    )
    , 12345
);

$server->run();

