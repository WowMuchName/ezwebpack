# ezwebpack

This project aims to make working with webpack a little easier.

Webpack expects a configuration object that can get rather complex. Containing rules on how to process all sorts of files. Usually you will find that your config is a collection of aspects.

For instance if you want to use typescript you will add the loader, add ts the list of processed extensions etc. EzWebpack makes your life easier by composing the config for you, given modular Configurators

## Webpacking a js library
```js
const Ez = require("ezwebpack").Ez;

Ez.webpack().subscribe((res) => {
    if(res.hasErrors()) {
        // ...
    } else {
        // ...
    }
});
```

under the hood this produces the following webpack config:
```json
{                                                                                 
  "entry": "[CWD]\\src\\index.js", 
  "resolve": {                                                                    
    "extensions": [                                                               
      ".js"                                                                       
    ]                                                                             
  },                                                                              
  "output": {                                                                     
    "filename": "index.js",                                                       
    "path": "[CWD]\\dist"          
  },                                                                              
  "module": {                                                                     
    "rules": []                                                                   
  }                                                                               
}                                                                                 
```

## Webpacking a ts library
```ts
Ez.webpack({
    from: "src/index.ts",
    configurators: [Ez.typescript()]
}).subscribe(() => {
    console.log("result");
});
```

under the hood this produces the following webpack config:
```js
{
  "entry": "[CWD]\\src\\index.ts",
  "resolve": {
    "extensions": [
      ".ts",
      ".tsx",
      ".js"
    ]
  },
  "output": {
    "filename": "index.js",
    "path": "[CWD]\\dist"
  },
  "module": {
    "rules": [
      {
        "test": /\.tsx?$/,
        "use": 'ts-loader',
        "exclude": /node_modules/
      }
    ]
  }
}                                                                                
```

## Api
The api is written in typescript. No @types package is required.

Ez.webpack accepts the folling config object:

|Property|Description|
|---|---|
|**root**| Root dir of the project. Is resolved against **CWD**. Defaults to *CWD*|
|**from**| The entry-file. Paths are relative to *root*. Defaults to *src/index.js*|
|**to**| Bundle file. Paths are relative to *root*. *output.filename* and *output.path* are generated from it. Defaults to *dist/index.js*|
|**mode**| *Ez.Mode.Once* or *Ez.Mode.Watch*. Defaults to *Ez.Mode.Once*|
|**configurators**| Functions that will receive a *Webpack.Configuration* object.|


## Composing from aspects
As can be seen in the typescript example above ezwebpack allows to create reusable Configurators that prepare your webpack build for some specific thing.

## Result-Observable
The *Ez.webpack* function return an *Rx.Observable*.
If the mode is set to *Ez.Mode.Once* this observable will either emit an result and then complete or receive an error.
If the mode is set to *Ez.Mode.Watch* this observable will emit *n* results over its lifetime.

**Note** that unlike *Ez.Mode.Once* build-failures are not considered errors! Build errors are denoted by *res.hasErrors()* being true.

## Build in Configurators

### Typescript

The option object has the following optional properties

|Property|Description|
|---|---|
|**tsconfig**| A path resolved against *root* denoting the location of the tsconfig.json to use. Default: Let the ts-loader worry about it|
|**tsoptions**| Allows to specify 'compiler flags'. This is effectively an CompilerOptions object shipped with typescript. However since the options are passed differently some may not work.|

#### Using none standard tsconfig.json location

You can store your tsconfig.json on a non standard path

```js
Ez.webpack({
    root: "subprojects/subprojectA",  // => [CWD]/subprojects/subprojectA
    from: "src/index.ts",             // => [CWD]/subprojects/subprojectA/src/index.ts
    configurators: [Ez.typescript({
        tsconfig: "app.tsconfig.json" // => [CWD]/subprojects/subprojectA/app.tsconfig.json
    })]
})
```
In my experience doing so works fine as far as the build is concerned, the autocompletion and error highlighting in the IDE being a different story.
It is recommended to stick to the standard path.

