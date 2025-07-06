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
  `avacomentario` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avadata` datetime NOT NULL DEFAULT current_timestamp(),
  `epicodigo` int(11) NOT NULL,
  PRIMARY KEY (`avacodigo`),
  UNIQUE KEY `usucodigo` (`usucodigo`,`epicodigo`),
  KEY `avaliacoes_ibfk_3` (`epicodigo`),
  CONSTRAINT `avaliacoes_ibfk_1` FOREIGN KEY (`usucodigo`) REFERENCES `usuarios` (`usucodigo`) ON DELETE CASCADE,
  CONSTRAINT `avaliacoes_ibfk_3` FOREIGN KEY (`epicodigo`) REFERENCES `episodios` (`epicodigo`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `avaliacoes`
--

LOCK TABLES `avaliacoes` WRITE;
/*!40000 ALTER TABLE `avaliacoes` DISABLE KEYS */;
INSERT INTO `avaliacoes` VALUES (1,1,0,5,NULL,'2025-06-22 00:00:00',4),(6,4,4,3,'nota atribuida ao episodio 4','2025-07-03 22:14:49',4);
/*!40000 ALTER TABLE `avaliacoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categorias`
--

DROP TABLE IF EXISTS `categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categorias` (
  `catcodigo` int(11) NOT NULL AUTO_INCREMENT,
  `catnome` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`catcodigo`),
  UNIQUE KEY `catnome` (`catnome`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES (2,'Cinema'),(4,'Educa‡Æo'),(1,'Empreendedorismo'),(3,'Esportes'),(5,'Games'),(10,'Geral'),(8,'Hist¢ria'),(7,'M£sica'),(6,'Meio Ambiente'),(9,'Tecnologia');
/*!40000 ALTER TABLE `categorias` ENABLE KEYS */;
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
  `comtexto` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `comdata` datetime NOT NULL DEFAULT current_timestamp(),
  `epicodigo` int(11) NOT NULL,
  PRIMARY KEY (`comcodigo`),
  KEY `usucodigo` (`usucodigo`),
  KEY `comentarios_ibfk_3` (`epicodigo`),
  CONSTRAINT `comentarios_ibfk_1` FOREIGN KEY (`usucodigo`) REFERENCES `usuarios` (`usucodigo`) ON DELETE CASCADE,
  CONSTRAINT `comentarios_ibfk_3` FOREIGN KEY (`epicodigo`) REFERENCES `episodios` (`epicodigo`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comentarios`
--

LOCK TABLES `comentarios` WRITE;
/*!40000 ALTER TABLE `comentarios` DISABLE KEYS */;
INSERT INTO `comentarios` VALUES (1,1,0,'Aqui eu farei o primeiro comentario','2025-06-22 00:00:00',4),(2,1,0,'oi','2025-06-22 00:00:00',4),(3,1,0,'terceiro','2025-06-22 00:00:00',4),(8,3,4,'comentario numero 5 sobre o episodio','2025-07-03 22:14:49',4);
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
  `epititulo` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `epidescricao` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `epiurl` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `epiduracao` int(11) DEFAULT NULL,
  `epidata` datetime DEFAULT current_timestamp(),
  `epistatus` enum('ativo','inativo','rascunho') COLLATE utf8mb4_unicode_ci DEFAULT 'ativo',
  `epidataatualizacao` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `epinumero` int(11) DEFAULT 0,
  `epiduracao_segundos` int(11) DEFAULT 0,
  `usucodigo` int(11) DEFAULT NULL,
  `epireproducoes` int(11) DEFAULT 0,
  `epiaudio` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`epicodigo`),
  KEY `podcodigo` (`podcodigo`),
  KEY `usucodigo` (`usucodigo`),
  CONSTRAINT `episodios_ibfk_1` FOREIGN KEY (`podcodigo`) REFERENCES `podcasts` (`podcodigo`) ON DELETE CASCADE,
  CONSTRAINT `episodios_ibfk_2` FOREIGN KEY (`usucodigo`) REFERENCES `usuarios` (`usucodigo`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `episodios`
--

LOCK TABLES `episodios` WRITE;
/*!40000 ALTER TABLE `episodios` DISABLE KEYS */;
INSERT INTO `episodios` VALUES (2,9,'Epis¢dio 1','Primeiro epis¢dio','/images/figura02.jpg',30,'2025-06-19 00:00:00','ativo',NULL,1,0,NULL,150,NULL),(4,19,'Fluminense bate Ulsan','Teste para trigger','teste 3',120,'2025-07-04 00:00:00','ativo','2025-07-04 17:54:39',0,0,1,0,'episodio1.mp3');
/*!40000 ALTER TABLE `episodios` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger atualiza_data_atualizacao_episodio
before update on episodios
for each row
begin
    set new.epidataatualizacao = current_timestamp();
end */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

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
  `epicodigo` int(11) NOT NULL,
  PRIMARY KEY (`favcodigo`),
  UNIQUE KEY `usucodigo` (`usucodigo`,`epicodigo`),
  KEY `favoritos_ibfk_3` (`epicodigo`),
  CONSTRAINT `favoritos_ibfk_1` FOREIGN KEY (`usucodigo`) REFERENCES `usuarios` (`usucodigo`) ON DELETE CASCADE,
  CONSTRAINT `favoritos_ibfk_3` FOREIGN KEY (`epicodigo`) REFERENCES `episodios` (`epicodigo`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favoritos`
--

LOCK TABLES `favoritos` WRITE;
/*!40000 ALTER TABLE `favoritos` DISABLE KEYS */;
INSERT INTO `favoritos` VALUES (2,4,2,2),(6,1,19,4);
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
  `podnome` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `poddescricao` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `podurl` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usucodigo` int(11) NOT NULL,
  `catcodigo` int(11) NOT NULL DEFAULT 10,
  PRIMARY KEY (`podcodigo`),
  KEY `usucodigo` (`usucodigo`),
  KEY `podcasts_ibfk_2` (`catcodigo`),
  CONSTRAINT `podcasts_ibfk_1` FOREIGN KEY (`usucodigo`) REFERENCES `usuarios` (`usucodigo`) ON DELETE CASCADE,
  CONSTRAINT `podcasts_ibfk_2` FOREIGN KEY (`catcodigo`) REFERENCES `categorias` (`catcodigo`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `podcasts`
--

LOCK TABLES `podcasts` WRITE;
/*!40000 ALTER TABLE `podcasts` DISABLE KEYS */;
INSERT INTO `podcasts` VALUES (9,'Inova‡Æo Hoje','Explorando ideias disruptivas','/images/figura02.jpg',4,1),(10,'CineCult','An lises profundas do cinema independente','/images/figura02.jpg',6,2),(11,'ArenaCast','Debates esportivos com especialistas','/images/figura02.jpg',3,3),(12,'Mentes Curiosas','Descubra curiosidades do mundo','/images/figura02.jpg',2,4),(13,'GameZone','Not¡cias e reviews do mundo gamer','/images/figura02.jpg',5,5),(14,'Planeta Verde','Conversas sobre meio ambiente e sustentabilidade','/images/figura02.jpg',7,6),(15,'Nota Musical','Entrevistas e lan‡amentos musicais','/images/figura02.jpg',8,7),(16,'Caf‚ com Hist¢ria','Fatos e personagens que marcaram o mundo','/images/figura02.jpg',2,8),(17,'C¢digo Aberto','Programa‡Æo, software livre e tecnologia','/images/figura02.jpg',6,9),(19,'Teste','apenas um teste atualizado 2','/images/figura02.jpg',1,10),(21,'Teste 1000','este teste é 10','/images/figura02.jpg',1,9),(23,'cafe com dados','discussoes sobre o impacto dos dados no dia a dia','/images/figura01.jpg',4,1),(24,'historias do amanha','narrativas sobre possiveis futuros','/images/figura02.jpg',8,2),(25,'voz da ciencia','entrevistas com cientistas renomados','/images/figura03.jpg',3,3),(26,'tecnologia explicada','conceitos tecnologicos para leigos','/images/figura04.jpg',5,4),(27,'debate esportivo','comentarios sobre jogos e jogadores','/images/figura05.jpg',4,5);
/*!40000 ALTER TABLE `podcasts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary table structure for view `progresso_por_episodio`
--

DROP TABLE IF EXISTS `progresso_por_episodio`;
/*!50001 DROP VIEW IF EXISTS `progresso_por_episodio`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE TABLE `progresso_por_episodio` (
  `usunome` tinyint NOT NULL,
  `epititulo` tinyint NOT NULL,
  `podnome` tinyint NOT NULL,
  `proprogresso` tinyint NOT NULL,
  `prodata` tinyint NOT NULL
) ENGINE=MyISAM */;
SET character_set_client = @saved_cs_client;

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
  UNIQUE KEY `usucodigo` (`usucodigo`,`epicodigo`),
  KEY `epicodigo` (`epicodigo`),
  CONSTRAINT `progresso_reproducao_ibfk_1` FOREIGN KEY (`usucodigo`) REFERENCES `usuarios` (`usucodigo`) ON DELETE CASCADE,
  CONSTRAINT `progresso_reproducao_ibfk_2` FOREIGN KEY (`epicodigo`) REFERENCES `episodios` (`epicodigo`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `progresso_reproducao`
--

LOCK TABLES `progresso_reproducao` WRITE;
/*!40000 ALTER TABLE `progresso_reproducao` DISABLE KEYS */;
INSERT INTO `progresso_reproducao` VALUES (1,3,2,51,'2025-07-03 22:14:49');
/*!40000 ALTER TABLE `progresso_reproducao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary table structure for view `resumo_favoritos_usuario`
--

DROP TABLE IF EXISTS `resumo_favoritos_usuario`;
/*!50001 DROP VIEW IF EXISTS `resumo_favoritos_usuario`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE TABLE `resumo_favoritos_usuario` (
  `usunome` tinyint NOT NULL,
  `epititulo` tinyint NOT NULL,
  `podnome` tinyint NOT NULL,
  `catnome` tinyint NOT NULL
) ENGINE=MyISAM */;
SET character_set_client = @saved_cs_client;

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

--
-- Final view structure for view `progresso_por_episodio`
--

/*!50001 DROP TABLE IF EXISTS `progresso_por_episodio`*/;
/*!50001 DROP VIEW IF EXISTS `progresso_por_episodio`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = latin1 */;
/*!50001 SET character_set_results     = latin1 */;
/*!50001 SET collation_connection      = latin1_swedish_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `progresso_por_episodio` AS select `usuarios`.`usunome` AS `usunome`,`episodios`.`epititulo` AS `epititulo`,`podcasts`.`podnome` AS `podnome`,`progresso_reproducao`.`proprogresso` AS `proprogresso`,`progresso_reproducao`.`prodata` AS `prodata` from (((`progresso_reproducao` join `usuarios` on(`progresso_reproducao`.`usucodigo` = `usuarios`.`usucodigo`)) join `episodios` on(`progresso_reproducao`.`epicodigo` = `episodios`.`epicodigo`)) join `podcasts` on(`episodios`.`podcodigo` = `podcasts`.`podcodigo`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `resumo_favoritos_usuario`
--

/*!50001 DROP TABLE IF EXISTS `resumo_favoritos_usuario`*/;
/*!50001 DROP VIEW IF EXISTS `resumo_favoritos_usuario`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = latin1 */;
/*!50001 SET character_set_results     = latin1 */;
/*!50001 SET collation_connection      = latin1_swedish_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `resumo_favoritos_usuario` AS select `usuarios`.`usunome` AS `usunome`,`episodios`.`epititulo` AS `epititulo`,`podcasts`.`podnome` AS `podnome`,`categorias`.`catnome` AS `catnome` from ((((`favoritos` join `usuarios` on(`favoritos`.`usucodigo` = `usuarios`.`usucodigo`)) join `episodios` on(`favoritos`.`epicodigo` = `episodios`.`epicodigo`)) join `podcasts` on(`episodios`.`podcodigo` = `podcasts`.`podcodigo`)) join `categorias` on(`podcasts`.`catcodigo` = `categorias`.`catcodigo`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-06 20:26:42
