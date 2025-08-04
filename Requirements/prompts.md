1. Requirement In this project enable enterpise class git setup
    with branching,
    CI/CD pipleline

    create bitbucket repository via cli  

2. Project description
    Frontend: react and nextjs
    backend: node nextjs
    Application: Filename generator give Brain id,series type,section. it should generate filename that can be edited and also copied to clipboard

1.1 git worktree setup for dev,testing,staging and production + for each developers

3. Docker setup enterpise grade. 
    with development, testing, staging and production. 
    
    all development,testing,staging,production use seperate subinterface and ip address  

    clean image and volumes 

    app inside the docker should not be running in root, unless nesscary. 
    
    Both development/testing host group and docker host group and uid should match production
    
    staging should take configurable usr id and group id for it internal running. 

4. Create a reposistory in dockerhub via cli 


4. PORT: All request inside to docker should via nginx and via single port. ngixn should do proxy. inter docker communication should be via docker internal  network
        dev port 18091
        test port 18092
        staging port 18093
        production port 18090
    NETWORK: should be different fo each of dev,test,staging,production
    SSL Certificate for ngix for development,testing,staging,production

5. start the development docker   

6. update .gitignore

7. commit version 1.0