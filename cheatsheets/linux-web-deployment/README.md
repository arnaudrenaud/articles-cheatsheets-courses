# Deploy a web service on a Linux server

Before deploying your app, [make sure it is ready for production ](/cheatsheets/prepare-web-app-production/README.md).

_Tested on Ubuntu 24.04:_

## Make server secure

- Provision a Linux server (for example, a virtual private server from DigitalOcean or OVH)
- Log in with SSH as default user: `ssh ubuntu@<hostname>`
- Update system packages: `sudo apt update && sudo apt upgrade`
- Create new user with your name and add it to `sudo` and `adm` groups: `sudo adduser <username>` and `sudo usermod -a -G sudo,adm <username>`
- Log out and log in again with the new user
- Delete default user: `sudo deluser --remove-home ubuntu`
- [Change SSH port](https://help.ovhcloud.com/csm/en-vps-security-tips?id=kb_article_view&sysparm_article=KB0047703#changing-the-default-ssh-listening-port) to avoid random SSH requests on default port 22
- Log out and log in again on the new port: `ssh <username>@<hostname> -p <port>`
- [Set up firewall](/cheatsheets/set-up-ufw-firewall-linux-web/README.md)
- Optionally, you can [set an SSH key](https://www.digitalocean.com/community/tutorials/how-to-configure-ssh-key-based-authentication-on-a-linux-server) on your local terminal to log in passwordless

To avoid potential performance issues in the future, you can [configure memory swap](https://wiki.crowncloud.net/?How_to_Add_Swap_Space_on_Ubuntu_24_04) now, or when memory usage starts running high.

## Install dependencies and run app

- Install dependencies required to run your app (for example with Docker: [installation](https://docs.docker.com/engine/install/ubuntu/) and [post-installation](https://docs.docker.com/engine/install/linux-postinstall/))
- Send runtime logs to journald for archival and storage management (for example with Docker: set [logging driver](https://docs.docker.com/config/containers/logging/journald) and `systemctl restart docker`)
- If you plan to fetch source code and build the app on the server itself, install required dependencies (for example: git, make)
- Fetch or build your app executable and start it (do not forget to set environment variables before start, if applicable)
- Make sure app is served locally on the server: `curl http://localhost:<port>`
- You can now review app logs: `journalctl CONTAINER_NAME=<docker container name> -f`

## Serve your app over the Internet

- Install a web server: [Caddy](https://caddyserver.com/docs/install#debian-ubuntu-raspbian) will allow HTTPS requests without any configuration
- Set up reverse proxy in Caddy configuration: `sudo vim /etc/caddy/Caddyfile`
- Update DNS records so that requests to your domain are forwarded to your server (then [make sure DNS servers have been updated](https://dnschecker.org))
- Reload Caddy : `systemctl reload caddy`
- Reboot server (`sudo reboot`) and make sure your web app also restarts (systemd services must be enabled, Docker containers run with `restart: always`)
- You can now review Caddy access logs in human-readable format: `journalctl -u caddy --since=today -f -o short-iso --output-fields=MESSAGE | GREP_COLOR='mt=01;33' grep -E --color=always "[0-9]{4}-[01][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9]" | grep -E --color=always "\"method[^,]*|\"uri[^,]*" | GREP_COLOR='mt=01;33'  grep -P --color=always "\"User-Agent\":\[(.*?)\]"`
