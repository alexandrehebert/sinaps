//This sample is how to use websocket of Tomcat.
package fr.djx.snake.ws;

import javax.servlet.http.HttpServletRequest;

import org.apache.catalina.websocket.StreamInbound;
import org.apache.catalina.websocket.WebSocketServlet;

public class SnakePoint extends WebSocketServlet {

	private static final long serialVersionUID = 1L;
	private static int UNIQUE_ID = 0;

	@Override
	protected StreamInbound createWebSocketInbound(String paramString,
			HttpServletRequest paramHttpServletRequest) {

		return new SnakeMessageClient(++UNIQUE_ID,
				paramHttpServletRequest.getRemoteAddr());
	}

}