const blocklist =require("node:net").BlockList
const fs=require("node:fs")

module.exports = class StaticBlockList extends blocklist {
    constructor(path) {
        super()
        this.path = path
        this.load()
        this.watch()
        this.isupdated=false
    }
    load() {
        const data = fs.readFileSync(this.path, "utf-8")
        this.fromJSON(data)
    }
    save() {
        const data = this.toJSON()
        this.isupdated=true
        fs.writeFileSync(this.path, data)
    }
    watch() {
        fs.watch(this.path, (eventType, filename) => {
            if (filename && !this.isupdated) {
                this.load()
                this.isupdated=!this.isupdated
            }
        })
    }
}