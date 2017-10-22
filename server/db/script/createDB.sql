CREATE TABLE `task` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `interval` int(11) unsigned DEFAULT NULL,
  `last_run_time` timestamp NULL DEFAULT NULL,
  `created` timestamp NULL DEFAULT NULL,
  `url` varchar(1000) CHARACTER SET latin1 NOT NULL DEFAULT '',
  `last_run_id` int(10) unsigned DEFAULT '0',
  `roi` varchar(100) CHARACTER SET latin1 DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8;


CREATE TABLE `log` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `changed` bit(1) DEFAULT NULL,
  `timestamp` timestamp NULL DEFAULT NULL,
  `success` bit(1) DEFAULT NULL,
  `task_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;