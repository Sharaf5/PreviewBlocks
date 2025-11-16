# Features
## v1.x
- [x] Display the language vscode used in codeblock syntax hylighting
- [x] Add copy icon/button for copying entire codeblock
- [x] Add sticky functionality to the header

## +v2.x
- [ ] * Sticky functionality could be determined by setting
- [ ] Add ability to change highlighting language used from any available highlighting lang
- [ ] Add ability to switch the behavior of mermaid and diagram blocks switching back to code
- [ ] Add zoom in/out/percentage for rendered blocks (ex. rendered mermaid)
- [ ] Add ability to save full diagram as pic

## Guidlines :-

1. one Mermaid preview extenstion must be enabled for mermaid functionalities to be enabled
2. any dependancy must not affect the extension base functionality set in v1
3. functionalities must be idempotent : ex. if a feature need dependancy that is disabled or not instailled or wont run : that dependant feature will be the only thing that stop and not the entire extention
