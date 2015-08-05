package fr.djx.snake.ws;

import static fr.djx.snake.core.SnakeLogic.SERVER_ID;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.util.logging.Logger;

import javax.inject.Inject;

import org.apache.catalina.websocket.MessageInbound;
import org.apache.catalina.websocket.WsOutbound;
import org.springframework.stereotype.Component;

import fr.djx.snake.core.SnakeLogic;
import fr.djx.snake.core.i.SnakeConnector;
import fr.djx.snake.errors.SnakeException;

@Component
public class SnakeMessageClient extends MessageInbound {

	private static final Logger logger = Logger.getLogger(SnakeLogic.class
			.getName());

	private WsOutbound out;
	private String id;
	private String addr;

	private static SnakeConnector connector;

	@Inject
	public void setConnector(SnakeConnector connector) {
		this.connector = connector;
	}

	protected SnakeMessageClient() {
		super();
	}

	public SnakeMessageClient(int uniqueID, String remoteAddr) {
		super();
		this.id = uniqueID + "";
		this.addr = remoteAddr;
	}

	@Override
	public void onOpen(WsOutbound outbound) {
		logger.info("# client join " + this.getID());
		this.out = outbound;
		connector.enter(this);
	}

	@Override
	public void onClose(int status) {
		logger.info("# client leave " + this.getID());
		connector.leave(this);
	}

	@Override
	public void onTextMessage(CharBuffer cb) throws IOException {
		logger.fine("> message " + id + " : " + cb);
		SnakeMessage message;
		if ((message = receive(cb)) == null) {
			// send("invalid message : " + cb);
		} else {
			try {
				if (!message.getCmd().equals("ping"))
					logger.info(cb.toString() + " from " + getAddr() + "/"
							+ getID());
				connector.compute(message);
			} catch (SnakeException | IllegalArgumentException e) {
				e.printStackTrace();
				logger.warning(e.getMessage());
				send("error", new String[] { e.getMessage() });
			}
		}
	}

	@Override
	public void onBinaryMessage(ByteBuffer bb) throws IOException {
		logger.fine("> binary-message : " + bb.get());
		// send("error", new String[] { "binary-mod not supported yet" });
	}

	public boolean send(CharBuffer message) {
		logger.fine("< message : " + message);
		try {
			out.writeTextMessage(message);
			out.flush();
		} catch (IOException e) {
			logger.severe(e.getMessage());
			return false;
		}
		return true;
	}

	public boolean send(String source, SnakeMessage message) {
		try {
			message.setSource(source);
			return send(CharBuffer.wrap(message.toJSON()));
		} catch (IOException e) {
			logger.severe(e.getMessage());
			return false;
		}
	}

	public boolean send(SnakeMessage message) {
		return send(SERVER_ID, message);
	}

	public boolean send(String command, String... args) {
		return send(SERVER_ID, SnakeMessage.create(command, args));
	}

	public boolean send(String source, String command, String... args) {
		return send(source, SnakeMessage.create(command, args));
	}

	public SnakeMessage receive(CharBuffer cb) {
		try {
			SnakeMessage message = SnakeMessage.fromJSON(cb.toString());
			message.setSource(getID());
			return message;
		} catch (IOException e) {
			logger.severe(e.getMessage());
			return null;
		}
	}

	public String getID() {
		return id;
	}

	public String getAddr() {
		return addr;
	}

}