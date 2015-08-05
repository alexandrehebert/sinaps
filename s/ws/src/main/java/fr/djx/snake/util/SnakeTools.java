package fr.djx.snake.util;

public class SnakeTools {

	public static String normalize(final String str) {

		final String normalizedString = str.toLowerCase()
				.replaceAll("[éèêë]", "e").replaceAll("[ùûü]", "u")
				.replaceAll("[îìï]", "i").replaceAll("[àãä]", "a")
				.replaceAll("[ôõòö]", "o").replaceAll("[ñ]", "n")
				.replaceAll("\\s+", " ").replaceAll("[\\s]", "_")
				.replaceAll("[_]+", "_").replaceAll("[^a-z0-9_]", "")
				// .replaceAll("[$\\*,&\"(-\\?!@^|=\\+;\\.:_]", "")
				.replace("%", "\\%");

		return normalizedString;

	}

}
