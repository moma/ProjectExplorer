## Startup script

In production, you may want to start the app's container automatically at boot.

### Exemple service
The suggested way is to create and enable a `systemd` service.

 1. Create a new service file in your systemd directory
    ```
    sudo touch /etc/systemd/system/comex2_docker.service
    ```
 2. You can use the following exemple for the contents of this new service file:
    ```
    [Unit]
    Description=Docker-compose container for comex2
    Requires=docker.service
    After=docker.service

    [Service]
    Type=oneshot
    RemainAfterExit=yes

    # docker-compose up
    ExecStart=/usr/bin/docker-compose -f /PATH/TO/YOUR/comex2/setup/dockers/docker-compose.yml up -d

    # docker-compose down
    ExecStop=/usr/bin/docker-compose -f /PATH/TO/YOUR/comex2/setup/dockers/docker-compose.yml down

    [Install]
    WantedBy=multi-user.target
    ```
    Remember to edit the 'PATH/TO/YOUR/comex2' arguments to fit your installation directory.

 3. Test if it works by reloading systemd and starting the service
    ```
    sudo systemctl daemon-reload
    sudo systemctl start comex2_docker.service
    ```
    also, to stop it manually:
    ```
    sudo systemctl stop comex2_docker.service
    ```

 4. Finally to make this service permanently enabled at boot, use the command:
    ```
    sudo systemctl enable comex2_docker.service
    ```


(see [docker systemd docs](https://docs.docker.com/engine/admin/host_integration/#systemd) for more information)
