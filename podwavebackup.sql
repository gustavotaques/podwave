-- MariaDB dump 10.17  Distrib 10.4.6-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: podwave
-- ------------------------------------------------------
-- Server version	10.4.6-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `avaliacoes`
--

DROP TABLE IF EXISTS `avaliacoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `avaliacoes` (
  `avacodigo` int(11) NOT NULL AUTO_INCREMENT,
  `usucodigo` int(11) NOT NULL,
  `podcodigo` int(11) NOT NULL,
  `avanota` int(1) NOT NULL CHECK (`avanota` between 1 and 5),
  `avacomentario` text DEFAULT NULL,
  `avadata` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`avacodigo`),
  UNIQUE KEY `usucodigo` (`usucodigo`,`podcodigo`),
  KEY `podcodigo` (`podcodigo`),
  CONSTRAINT `avaliacoes_ibfk_1` FOREIGN KEY (`usucodigo`) REFERENCES `usuarios` (`usucodigo`) ON DELETE CASCADE,
  CONSTRAINT `avaliacoes_ibfk_2` FOREIGN KEY (`podcodigo`) REFERENCES `podcasts` (`podcodigo`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `avaliacoes`
--

LOCK TABLES `avaliacoes` WRITE;
/*!40000 ALTER TABLE `avaliacoes` DISABLE KEYS */;
/*!40000 ALTER TABLE `avaliacoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comentarios`
--

DROP TABLE IF EXISTS `comentarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `comentarios` (
  `comcodigo` int(11) NOT NULL AUTO_INCREMENT,
  `usucodigo` int(11) NOT NULL,
  `podcodigo` int(11) NOT NULL,
  `comtexto` text NOT NULL,
  `comdata` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`comcodigo`),
  KEY `usucodigo` (`usucodigo`),
  KEY `podcodigo` (`podcodigo`),
  CONSTRAINT `comentarios_ibfk_1` FOREIGN KEY (`usucodigo`) REFERENCES `usuarios` (`usucodigo`) ON DELETE CASCADE,
  CONSTRAINT `comentarios_ibfk_2` FOREIGN KEY (`podcodigo`) REFERENCES `podcasts` (`podcodigo`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comentarios`
--

LOCK TABLES `comentarios` WRITE;
/*!40000 ALTER TABLE `comentarios` DISABLE KEYS */;
/*!40000 ALTER TABLE `comentarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `episodios`
--

DROP TABLE IF EXISTS `episodios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `episodios` (
  `epicodigo` int(11) NOT NULL AUTO_INCREMENT,
  `podcodigo` int(11) NOT NULL,
  `epititulo` varchar(100) NOT NULL,
  `epidescricao` text DEFAULT NULL,
  `epiurl` varchar(255) NOT NULL,
  `epiduracao` int(11) DEFAULT NULL,
  PRIMARY KEY (`epicodigo`),
  KEY `podcodigo` (`podcodigo`),
  CONSTRAINT `episodios_ibfk_1` FOREIGN KEY (`podcodigo`) REFERENCES `podcasts` (`podcodigo`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `episodios`
--

LOCK TABLES `episodios` WRITE;
/*!40000 ALTER TABLE `episodios` DISABLE KEYS */;
/*!40000 ALTER TABLE `episodios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favoritos`
--

DROP TABLE IF EXISTS `favoritos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `favoritos` (
  `favcodigo` int(11) NOT NULL AUTO_INCREMENT,
  `usucodigo` int(11) NOT NULL,
  `podcodigo` int(11) NOT NULL,
  PRIMARY KEY (`favcodigo`),
  UNIQUE KEY `usucodigo` (`usucodigo`,`podcodigo`),
  KEY `podcodigo` (`podcodigo`),
  CONSTRAINT `favoritos_ibfk_1` FOREIGN KEY (`usucodigo`) REFERENCES `usuarios` (`usucodigo`) ON DELETE CASCADE,
  CONSTRAINT `favoritos_ibfk_2` FOREIGN KEY (`podcodigo`) REFERENCES `podcasts` (`podcodigo`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favoritos`
--

LOCK TABLES `favoritos` WRITE;
/*!40000 ALTER TABLE `favoritos` DISABLE KEYS */;
/*!40000 ALTER TABLE `favoritos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `podcasts`
--

DROP TABLE IF EXISTS `podcasts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `podcasts` (
  `podcodigo` int(11) NOT NULL AUTO_INCREMENT,
  `podnome` varchar(100) NOT NULL,
  `poddescricao` text DEFAULT NULL,
  `podurl` varchar(255) DEFAULT NULL,
  `usucodigo` int(11) NOT NULL,
  `podcategoria` varchar(50) NOT NULL DEFAULT 'Geral',
  PRIMARY KEY (`podcodigo`),
  KEY `usucodigo` (`usucodigo`),
  CONSTRAINT `podcasts_ibfk_1` FOREIGN KEY (`usucodigo`) REFERENCES `usuarios` (`usucodigo`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `podcasts`
--

LOCK TABLES `podcasts` WRITE;
/*!40000 ALTER TABLE `podcasts` DISABLE KEYS */;
INSERT INTO `podcasts` VALUES (9,'Inova‡Æo Hoje','Explorando ideias disruptivas','/images/figura02.jpg',4,'Empreendedorismo'),(10,'CineCult','An lises profundas do cinema independente','/images/figura02.jpg',6,'Cinema'),(11,'ArenaCast','Debates esportivos com especialistas','/images/figura02.jpg',3,'Esportes'),(12,'Mentes Curiosas','Descubra curiosidades do mundo','/images/figura02.jpg',2,'Educa‡Æo'),(13,'GameZone','Not¡cias e reviews do mundo gamer','/images/figura02.jpg',5,'Games'),(14,'Planeta Verde','Conversas sobre meio ambiente e sustentabilidade','/images/figura02.jpg',7,'Meio Ambiente'),(15,'Nota Musical','Entrevistas e lan‡amentos musicais','/images/figura02.jpg',8,'M£sica'),(16,'Caf‚ com Hist¢ria','Fatos e personagens que marcaram o mundo','/images/figura02.jpg',2,'Hist¢ria'),(17,'C¢digo Aberto','Programa‡Æo, software livre e tecnologia','/images/figura02.jpg',6,'Tecnologia');
/*!40000 ALTER TABLE `podcasts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `progresso_reproducao`
--

DROP TABLE IF EXISTS `progresso_reproducao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `progresso_reproducao` (
  `procodigo` int(11) NOT NULL AUTO_INCREMENT,
  `usucodigo` int(11) NOT NULL,
  `epicodigo` int(11) NOT NULL,
  `proprogresso` int(11) NOT NULL,
  `prodata` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`procodigo`),
  KEY `usucodigo` (`usucodigo`),
  KEY `epicodigo` (`epicodigo`),
  CONSTRAINT `progresso_reproducao_ibfk_1` FOREIGN KEY (`usucodigo`) REFERENCES `usuarios` (`usucodigo`) ON DELETE CASCADE,
  CONSTRAINT `progresso_reproducao_ibfk_2` FOREIGN KEY (`epicodigo`) REFERENCES `episodios` (`epicodigo`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `progresso_reproducao`
--

LOCK TABLES `progresso_reproducao` WRITE;
/*!40000 ALTER TABLE `progresso_reproducao` DISABLE KEYS */;
/*!40000 ALTER TABLE `progresso_reproducao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usuarios` (
  `usucodigo` int(11) NOT NULL AUTO_INCREMENT,
  `usunome` varchar(50) NOT NULL,
  `usuemail` varchar(50) NOT NULL,
  `ususenha` varchar(30) NOT NULL,
  `tipo_usuario` enum('comum','admin') NOT NULL DEFAULT 'comum',
  PRIMARY KEY (`usucodigo`),
  UNIQUE KEY `usuemail` (`usuemail`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Gustavo','gustavo@gmail.com','123','admin'),(2,'Joao','joao@gmail.com','123','comum'),(3,'Jose','jose@gmail.com','123','comum'),(4,'Julia','julia@gmail.com','123','comum'),(5,'Josivaldo','josivaldo@gmail.com','123','comum'),(6,'Luisa','luisa@gmail.com','123','comum'),(7,'Alan','alan@gmail.com','123','comum'),(8,'Test User','test@example.com','password123','comum');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-31 14:32:40
