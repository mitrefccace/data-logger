# Data Logger

The Data Logger is a tool that collects debug logs on asterisk server. It contains the following functionalities:
* Manage a test session to log asterisk debug log and wireshark log
* Saves the test sessions on aws S3 cloud storage
* Create test result matrix
* Export selected test session data

### MySQL Database Installation
This section provides an overview of the MySQL server along with installation
and setup documentation.

Install dependent packages:

`sudo yum install unixODBC unixODBC-devel libtool-ltdl libtool-ltdl-devel mysql-connector-odbc`

Download the Yum repository configuration file:
`wget https://dev.mysql.com/get/mysql57-community-release-el7-9.noarch.rpm`

Install the Yum repository configuration file:
`sudo rpm -ivh mysql57-community-release-el7-9.noarch.rpm`

Install the MySQL server:
`sudo yum install mysql-server`

Start the MySQL server:
`sudo systemctl start mysqld`

A temporary password is generated as part of the installation process. It is
in the mysqld.log file and can be found with this command:
`sudo grep 'temporary password' /var/log/mysqld.log`

MySQL includes a security script to change some of the default, non-secure
options:

`sudo mysql_secure_installation`

As part of the security script, the user will be prompted for a new password. The new password must be at least 12-characters and contain at least one uppercase letter, one lowercase letter, one number and once special character.

To stop the MySQL server:
`sudo systemctl stop mysqld`

### MySQL Database Configuration
The Data Logger will require two MySQL databases and the corresponding accounts to be created.

Enter the MySQL shell, enter the root password when prompted:

`mysql -uroot -p`

Inside the MySQL shell, create the following databases and accounts for access:

`mysql> create database asterisk;`

`mysql> create database <database_name>;`

Create the database accounts and issue the grants:
`mysql> grant all on asterisk.* to '<user>'@'localhost' identified by 'password here';`

`mysql> grant all on <database_name>.* to '<user>'@'localhost' identified by 'password here';`

Exit the MySQL shell:

`mysql> exit;`

The next step is to instantiate the databases. The asterisk_schema.txt and <database_name>_schema.txt files are included as part of the public release download.

From the command prompt (not the MySQL prompt) type the following and enter the password when prompted:

`mysql -u<user> -p asterisk < asterisk_schema.txt`

`mysql -u<user> -p <database_name> < <database_name>_schema.txt`


### Data Logger Software Installation
1. Clone this repository **TODO: INSERT REPO HERE**
1. Install [Node.js](https://nodejs.org/en/) >= version 8.x
1. Type `cd data-logger`
1. Install the required Node.js modules: from the data-logger directory,
run `npm install`
1. Move the web dependencies to the public/assets directory, run `npm run build`
1. Install [PM2](https://www.npmjs.com/package/pm2) >= v2.4.6 by running `npm install -g pm2`

### Update data logger on Asterisk server
1. Stop the running session of data-logger (find the session using `ps -elf | grep data-logger` if it was not previsouly run using pm2)
1. Update the data-logger git respository (on most Asterisk servers they are located under `/home/centos`)
1. Restart the data-logger using pm2 (`pm2 start /home/centos/git/data-logger/bin/www`)

### SSL Configuration
1. Data Logger software uses SSL which requires a valid key and certificate.
1. Enable SSL by specifying `https` as the protocol value in the config.json
file.
1. The location of the SSL key and certificate can be specified in the
config.json by using the ssl:cert and ssl:key parameters in the form of
folder/file (e.g., ssl/mycert.pem and ssl/mykey.pem)


###	Server Software Configuration
The data-logger directory contains a file named config.json. The config.json
file is contains the configuration parameters used by the server. The
configuration parameters and the definitions are shown below.

```json
{
    "debuglevel": "ALL | TRACE | DEBUG | INFO | WARN ERROR | FATAL | OFF",
    "port": "server listen port #",
    "logdirectory": "path where logs are stored",
    "proxy":"proxy address",
    "s3bucket":"S3 bucket name",
    "ssl" : {
      "key": "path to key",
      "cert": "path to cert"
    },
    "session": {
      "name":"session name",
      "secret": "secret here",
    },
    "mysql": {
      "host": "localhost",
      "user": "mysql username",
      "password": "mysql password",
      "database": "<database_name>"
    }
}
```


## Starting the Server
To start the Data Logger Server:
* `cd data-logger`
* Run `npm start` or `node bin/www`

### Accessing the site
1. Data Logger, go to: https://host:port/
