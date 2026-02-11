**NOTE：**
The Project is developed for 天津方标世纪规划建筑设计有限公司.
It is built on Google aistudio and based on **GEMINI models**, can refine prompt to generate images.
This is a local version.You can load any model,but need an API key yourself.
This application only has basic fubctuons.Generate imames,chatbox.Can load reference image.And it supports **multiple imagei**.
There are two ways to use it.
One way:**Prerequisites:**  Node.js
   1.download all of the codes;
   2.run cmd in current folder;
   3.step by step:
         3.1 pip install fastapi uvicorn requests wmi pycryptodome;
         3.2 pip install pyinstaller;
         3.3 npm install;
         3.4 npm run build;
         3.5 pyinstaller --noconsole --onefile --clean --add-data "dist;dist" --add-data "logo.png;." server.py
   system can generate a folder named "dist", icontains 3 files,.exe is the running file.
The other way:
You can download the folder directly named "FBCenturyai".icontains 3 files ,run ".exe".
In either case ,you need license(one code per machine,365day.) ,else can not running .please contact me.

         
   

