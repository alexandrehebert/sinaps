package fr.djx.snake.ws;

import java.io.IOException;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;

import org.codehaus.jackson.annotate.JsonProperty;
import org.codehaus.jackson.map.ObjectMapper;

@XmlRootElement(name = "snake")
public class SnakeMessage {

	@XmlTransient
	private static final ObjectMapper jsonMapper = new ObjectMapper();

	@XmlElement(name = "cmd")
	@JsonProperty("cmd")
	private String _cmd;

	@XmlElement(name = "source")
	@JsonProperty("source")
	private String _source;

	@XmlElement(name = "args")
	@JsonProperty("args")
	private String[] _args;

	protected SnakeMessage() {
	}

	protected SnakeMessage(String cmd, String[] args) {
		setCmd(cmd);
		setArgs(args);
	}

	public String getCmd() {
		return this._cmd;
	}

	public void setCmd(final String cmd) {
		this._cmd = cmd.toLowerCase();
	}

	public String getSource() {
		return _source;
	}

	public void setSource(String source) {
		this._source = source;
	}

	public String[] getArgs() {
		return this._args == null ? new String[] {} : this._args;
	}

	public void setArgs(final String... args) {
		this._args = args;
	}

	public String toJSON() throws IOException {
		return jsonMapper.writeValueAsString(this);
	}

	public static SnakeMessage fromJSON(String message) throws IOException {
		return jsonMapper.readValue(message, SnakeMessage.class);
	}

	public static final SnakeMessage create(String cmd, String... args) {
		return new SnakeMessage(cmd, args);
	}

	public String toString() {
		return getCmd().length() + " " + getArgs().length;
	}

	public String getArg(int i) {
		return _args[i];
	}
}
