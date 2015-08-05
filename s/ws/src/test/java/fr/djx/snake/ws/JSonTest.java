package fr.djx.snake.ws;

import java.io.File;
import java.util.logging.Logger;

import org.codehaus.jackson.map.ObjectMapper;

public class JSonTest {

	static final ObjectMapper mapper = new ObjectMapper();
	static final Logger logger = Logger.getLogger(JSonTest.class.getName());

	public static void main(String[] args) throws Exception {
		SnakeMessage message = mapper.readValue(new File(
				"src/test/resources/test.json"), SnakeMessage.class);
		logger.info(message.getCmd());
	}

}