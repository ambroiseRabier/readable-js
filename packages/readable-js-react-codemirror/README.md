FOR DEV: you need to install the peerDep react and react-dom locally to have good autocompletion
But when using CRA, it complain about two version of react. so you have to delete them

ASLO:

    "@readable-js/core": "file:../readable-js"

You need to use that for dev. but for prod (that was the good point of workspaces...)
