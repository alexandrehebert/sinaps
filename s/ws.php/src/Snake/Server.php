<?php

namespace Snake;
// require __DIR__ . '../../../vendor/autoload.php';

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use stdClass;



function str_startswith($haystack, $needle) {
    return $needle === "" || strpos($haystack, $needle) === 0;
}

function str_endswith($haystack, $needle) {
    return $needle === "" || substr($haystack, -strlen($needle)) === $needle;
}

function d($m) {
    echo $m."\n";
}



class Server implements MessageComponentInterface {

    protected $clients;

    public function __construct() {
        $this->clients = new \SplObjectStorage;
    }

    public function onOpen(ConnectionInterface $conn) {
        // Store the new connection to send messages to later
        $this->clients->attach($conn);
        echo "New connection! ({$conn->resourceId})\n";
    }

    public function onMessage(ConnectionInterface $from, $request) {
        if ($commandArray = $this->recieve($from, $request)) {
            list($cmd, $args) = $commandArray;
            switch ($cmd) {
            case 'wisp':
                if ($to = $this->getClient($args[0]))
                    $this->send($to, 'talk', $args[1]);
                else $this->send($from, 'error', array('unknown target'));
            case 'talk':
            default:
                foreach ($this->clients as $client)
                    $this->send($from, 'talk', array($args[0]));
                break;
            }
        }
        else {
            $this->send($from, 'error', array('invalid command !'));
        }
    }

    public function onClose(ConnectionInterface $conn) {
        // The connection is closed, remove it, as we can no longer send it messages
        $this->clients->detach($conn);

        echo "Connection {$conn->resourceId} has disconnected\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "An error has occurred: {$e->getMessage()}\n";

        $conn->close();
    }
    
    

    private function createResponse(ConnectionInterface $from, $cmd, $args = array()) {
        $obj = new stdClass;
        $obj->cmd = $cmd;
        $obj->source = $from->resourceId;
        $obj->args = $args;
        return json_encode($obj);
    }

    private function send(ConnectionInterface $from, $cmd, $args = array()) {
        $response = $this->createResponse($from, $cmd, $args);
        d("< client(".$from->resourceId.") ".$response);
        $from->send($response);
    }

    private function recieve(ConnectionInterface $from, $commandLine) {
        $command = json_decode($commandLine);
        if ($command && $command->cmd && $command->args) {
            d("> client(".$from->resourceId.") ".$commandLine);
            return array($command->cmd, $command->args);
        }
        return FALSE;
    }
    
    private function getClient($id) {
        foreach ($this->clients as $client) {
            if ($client->resourceId == $id)
                return $client;
        }
        return false;
    }
    
}



class SnakeGame {
  
    protected $players = array();
    protected $spectators = array();

    public function addPlayer(SnakePlayer $player) {
        if (!in_array($this->players, $player)) {
            $this->players[$player->resourceId] = $player;
        }
    }

    public function removePlayer(SnakePlayer $player) {
        unset($this->players[$player->resourceId]);
    }
  
}



class SnakePlayer {

  public $sock;
  
  

}

