## description

 add a proxy to CSS 
 see https://github.com/solid-contrib/pivot/issues/12
 


## standalone run

```
 npm i
 npm build
 npm run start
 curl localhost:3000/.proxy
 curl localhost:3000/.proxy?uri=https://info.cern.ch
```
## add it to a recipe

On your recipe folder:

```
npm install --save proxy-module
```

Then merge the following to your `config.json`

```
{
  "@context": [
    "https://linkedsoftwaredependencies.org/bundles/npm/@solid/community-server/^7.0.0/components/context.jsonld",
    "https://linkedsoftwaredependencies.org/bundles/npm/proxy-module/^7.0.0/components/context.jsonld"
  ],
  "import": [
    "proxy:config/proxy-partial.json"
  ]
}
```




## todo

 - add test
