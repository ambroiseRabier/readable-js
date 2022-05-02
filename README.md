
## Development

Check that your Node version support NPM workspaces.
This use NPM workspaces. `npm i` on root, maybe on each package inside `packages` ?
build the lib, and build the editor next.
run editor public/index.html with your IDE (I use Webstorm) (or use serve package or something)


## Workspaces

It was working until CRA arrived, complaining about multiple version of react. Maybe noHoist option in package.json
could help, but only supported by Yarn right now.
