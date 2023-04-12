# Ptero Taskmanager

This project was created to easily perform common and multiple tasks across a number of servers that are maintained with the [Pterodactyl Panel](https://pterodactyl.io/).

## Background
I'm a moderator in a community where we host dozens of servers with the same Minecraft modpack. Each time the modpack had to be updated, it had to be updated on every server. Each update involved uploading a file, stopping the server, deleting old mods and configs, extracting the file and starting the server.

I don't like repetetive manual tasks and so I looked at the [Pterodactyl APIs](https://github.com/devnote-dev/ptero-notes) for a way to automate. At the same time I felt like learning the modern JS, HTML and CSS (my knowledge dated from the early 2000's) and thus I came up with this project.

## Implementation
The Pterodactyl APIs use an API key that can be obtained through the admin panel. This application authenticates itself against the API endpoints by passing this key. Those APIs are also used by the panel itself where authentication is based on session cookies. This causes some behaviours on the API endpoints that had to be worked around.

For example, some APIs would require a CSRF token if the Origin header is passed in the request. If these calls are made from a browser, as a pure frontend application, the Origin header is always present; however getting a CSRF token was undocumented and is also not a feature I wanted to implement (also since I believe it is unnecessary for an Authorization header based call).

It was suggested to make these calls from a server which gives full control over the headers, allowing me to omit the Origin header. Since this also hides the API key from the user, I felt this was the best approach and thus I went from my initial pure [React](https://reactjs.org/) application to a [Next.js](https://nextjs.org/) application.

The frontend part connects to the backend websocket (`/api/socket`) which pushes information about server statuses and resources, to update the realtime information in the UI. Additionally, a single API (`/api/runTasks`) call is made with a list of servers and tasks to be executed. The execution happens completely in the backend and updates are pushed to the existing websocket.

## Configuration
The project uses a [YAML](https://yaml.org/) file with details about the API endpoint and the servers. The format is:
```yaml

# Pterodactyl Panel Information:
panelDomain: "panelurl.net"
clientKey: "ptlc_FAKEKEYWILLNOTWORK"

# servers
categories:
- name: "Category Name 1"
  servers:
    - name: "Server Name 1"
      id: "dd15f315"
    - name: "Server Name 2"
      id: "42aa13a2"
    - name: "Server Name 3"
      id: "2eb9bf30"
- name: "Category Name 2"
  servers:
    - name: "Server Name 4"
      id: "94c1e340"
    - name: "Server Name 5"
      id: "c92c7882"
- name: "Category Name 3"
  servers:
    - name: "Server Name 6"
      id: "9a1c0741"
    - name: "Server Name 7"
      id: "e83c06f5"
    - name: "Server Name 8"
      id: "bd8f5d1e"
```
where `id` is the Pterodactyl Panel ID of the server (e.g. in `https://panelurl.net/server/dd15f315`).

## UI
The UI is divided in 3 parts:
 - List of servers by category
 - Set of tasks
 - Execution status
![](./public/screenshot.png)

## Server list
This section shows all configured servers by category and in the order that you've configured them in the YAML file. The status, CPU and memory resources are updated approx. every second through websockets. The toggle behind a server can be enabled if you want the server to be included in the task run; if you click the **Tasks** header above, it will enable or disable all servers in the category at once.

## Tasks
Here you define a set of tasks to be executed.

### Buttons on the top bar:  
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="20px" height="20px"><path d="M470.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L402.7 256 265.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160zm-352 160l160-160c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L210.7 256 73.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0z" fill="white"/></svg> - Run the tasks  
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="20px" height="20px"><path d="M384 480h48c11.4 0 21.9-6 27.6-15.9l112-192c5.8-9.9 5.8-22.1 .1-32.1S555.5 224 544 224H144c-11.4 0-21.9 6-27.6 15.9L48 357.1V96c0-8.8 7.2-16 16-16H181.5c4.2 0 8.3 1.7 11.3 4.7l26.5 26.5c21 21 49.5 32.8 79.2 32.8H416c8.8 0 16 7.2 16 16v32h48V160c0-35.3-28.7-64-64-64H298.5c-17 0-33.3-6.7-45.3-18.7L226.7 50.7c-12-12-28.3-18.7-45.3-18.7H64C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H87.7 384z" fill="white"/></svg> - Open a JSON file containing a set of tasks <sup>\*</sup>  
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="20px" height="20px"><path d="M48 96V416c0 8.8 7.2 16 16 16H384c8.8 0 16-7.2 16-16V170.5c0-4.2-1.7-8.3-4.7-11.3l33.9-33.9c12 12 18.7 28.3 18.7 45.3V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V96C0 60.7 28.7 32 64 32H309.5c17 0 33.3 6.7 45.3 18.7l74.5 74.5-33.9 33.9L320.8 84.7c-.3-.3-.5-.5-.8-.8V184c0 13.3-10.7 24-24 24H104c-13.3 0-24-10.7-24-24V80H64c-8.8 0-16 7.2-16 16zm80-16v80H272V80H128zm32 240a64 64 0 1 1 128 0 64 64 0 1 1 -128 0z" fill="white"/></svg> - Save the tasks to a JSON file  
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="20px" height="20px"><path d="M170.5 51.6L151.5 80h145l-19-28.4c-1.5-2.2-4-3.6-6.7-3.6H177.1c-2.7 0-5.2 1.3-6.7 3.6zm147-26.6L354.2 80H368h48 8c13.3 0 24 10.7 24 24s-10.7 24-24 24h-8V432c0 44.2-35.8 80-80 80H112c-44.2 0-80-35.8-80-80V128H24c-13.3 0-24-10.7-24-24S10.7 80 24 80h8H80 93.8l36.7-55.1C140.9 9.4 158.4 0 177.1 0h93.7c18.7 0 36.2 9.4 46.6 24.9zM80 128V432c0 17.7 14.3 32 32 32H336c17.7 0 32-14.3 32-32V128H80zm80 64V400c0 8.8-7.2 16-16 16s-16-7.2-16-16V192c0-8.8 7.2-16 16-16s16 7.2 16 16zm80 0V400c0 8.8-7.2 16-16 16s-16-7.2-16-16V192c0-8.8 7.2-16 16-16s16 7.2 16 16zm80 0V400c0 8.8-7.2 16-16 16s-16-7.2-16-16V192c0-8.8 7.2-16 16-16s16 7.2 16 16z" fill="white"/></svg> - Clear the tasks  
<sup>\*</sup> *Alternatively you can drag & drop a JSON file onto the Tasks container.*

### Buttons on each task:
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="20px" height="20px"><path d="M201.4 137.4c12.5-12.5 32.8-12.5 45.3 0l160 160c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L224 205.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l160-160z" fill="white"/></svg> - Move the task up  
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="20px" height="20px"><path d="M201.4 342.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 274.7 86.6 137.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z" fill="white"/></svg> - Move the task down  
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="20px" height="20px"><path d="M170.5 51.6L151.5 80h145l-19-28.4c-1.5-2.2-4-3.6-6.7-3.6H177.1c-2.7 0-5.2 1.3-6.7 3.6zm147-26.6L354.2 80H368h48 8c13.3 0 24 10.7 24 24s-10.7 24-24 24h-8V432c0 44.2-35.8 80-80 80H112c-44.2 0-80-35.8-80-80V128H24c-13.3 0-24-10.7-24-24S10.7 80 24 80h8H80 93.8l36.7-55.1C140.9 9.4 158.4 0 177.1 0h93.7c18.7 0 36.2 9.4 46.6 24.9zM80 128V432c0 17.7 14.3 32 32 32H336c17.7 0 32-14.3 32-32V128H80zm80 64V400c0 8.8-7.2 16-16 16s-16-7.2-16-16V192c0-8.8 7.2-16 16-16s16 7.2 16 16zm80 0V400c0 8.8-7.2 16-16 16s-16-7.2-16-16V192c0-8.8 7.2-16 16-16s16 7.2 16 16zm80 0V400c0 8.8-7.2 16-16 16s-16-7.2-16-16V192c0-8.8 7.2-16 16-16s16 7.2 16 16z" fill="white"/></svg> - Delete the task

### Bottom button:
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="20px" height="20px"><path d="M64 80c-8.8 0-16 7.2-16 16V416c0 8.8 7.2 16 16 16H384c8.8 0 16-7.2 16-16V96c0-8.8-7.2-16-16-16H64zM0 96C0 60.7 28.7 32 64 32H384c35.3 0 64 28.7 64 64V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V96zM200 344V280H136c-13.3 0-24-10.7-24-24s10.7-24 24-24h64V168c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H248v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z" fill="white"/></svg> - Add a new task.  
This opens a popup where you can select a task to be added; the same task type can be added more than once (e.g. to delete different files).

## Execution status

When the tasks are being executed, this will show the status of each task on each server.

# Deploying

## Deploy on Vercel
The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Deploy on NodeJS server
To deploy this application in a NodeJS capable environment, first build the application with:
```bash
npm run build
# or
yarn build
# or
pnmp build
```
Next start the server with:
```bash
npm run start
# or
yarn start
# or
pnmp start
```

# Development
This project is offered as open source under the GNU General Public License v3.0 (see [LICENSE.md](LICENSE.md)). You're welcome to make changes as you desire as long as you follow the license agreement.
