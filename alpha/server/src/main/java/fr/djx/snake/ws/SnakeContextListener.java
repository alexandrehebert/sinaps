package fr.djx.snake.ws;

import javax.inject.Inject;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import org.springframework.context.ApplicationContext;
import org.springframework.context.support.ClassPathXmlApplicationContext;
import org.springframework.stereotype.Component;

import fr.djx.snake.core.i.SnakeDatas;

@Component
public class SnakeContextListener implements ServletContextListener {

	public static ApplicationContext context;

	protected static SnakeDatas datas;

	@Override
	public void contextDestroyed(ServletContextEvent arg0) {
		datas.backup();
	}

	@Override
	public void contextInitialized(ServletContextEvent arg0) {
		if (context == null)
			context = new ClassPathXmlApplicationContext(
					new String[] { "spring-autoscan.xml" });
		datas.restore();
	}

	@Inject
	public void setDatas(SnakeDatas datas) {
		this.datas = datas;
	}

}
