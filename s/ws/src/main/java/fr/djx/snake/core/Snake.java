package fr.djx.snake.core;

public class Snake {

	private boolean isAlive = true;
	private int foods = 0;

	public boolean isAlive() {
		return isAlive;
	}

	public void setAlive(boolean isAlive) {
		this.isAlive = isAlive;
	}

	public void eat(int type) {
		foods++;
	}

	public int getSize() {
		return foods;
	}

}
