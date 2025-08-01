const blocklist =require("node:net").BlockList
const fs=require("node:fs")
const path=require("node:path")
module.exports = class StaticBlockList extends blocklist {
    constructor(path) {
        super()
        this.path = path
        this.load()
        this.watch()
        this.isupdated=false
    }
    load() {
        try {
            if (!fs.existsSync(this.path)) {
                // Créer un fichier vide s'il n'existe pas
                fs.writeFileSync(this.path, '[]', 'utf-8');
                return;
            }
            const data = fs.readFileSync(this.path, "utf-8");
            if (data.trim()) {  // Vérifie si le fichier n'est pas vide
                this.fromJSON(data);
            }
        } catch (err) {
            console.error(`Error loading blocklist from ${this.path}:`, err.message);
            // Initialiser avec une liste vide en cas d'erreur
            this.fromJSON('[]');
        }
    }
    save() {
        try {
            // Récupérer la liste des règles actuelles
            const rules = this.rules || [];
            
            // Formater correctement les données pour la sauvegarde
            const data = JSON.stringify(rules, null, 2);
            
            // Mettre à jour le flag avant d'écrire pour éviter les boucles de watch
            this.isupdated = true;
            
            // Créer le répertoire s'il n'existe pas
            const dir = path.dirname(this.path);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            // Écrire le fichier avec un verrou pour éviter les accès concurrents
            const tmpPath = `${this.path}.tmp`;
            fs.writeFileSync(tmpPath, data, 'utf-8');
            
            // Renommer le fichier temporaire pour assurer une écriture atomique
            if (fs.existsSync(this.path)) {
                fs.unlinkSync(this.path);
            }
            fs.renameSync(tmpPath, this.path);
            
            return true;
        } catch (err) {
            console.error(`Error saving blocklist to ${this.path}:`, err);
            throw err; // Propager l'erreur pour une gestion ultérieure
        }
    }
    watch() {
        try {
            fs.watch(this.path, (eventType, filename) => {
                if (filename && !this.isupdated) {
                    try {
                        this.load();
                    } catch (err) {
                        console.error('Error in watch handler:', err.message);
                    }
                    this.isupdated = !this.isupdated;
                }
            }).on('error', (err) => {
                console.error('Error watching file:', err.message);
            });
        } catch (err) {
            console.error('Failed to set up file watcher:', err.message);
        }
    }
}
