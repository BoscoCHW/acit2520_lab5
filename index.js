const fs = require('fs');
const databaseDir = './database.txt'
const path = require("path");


const promiseAppendFile = (fileName, content) => {
    return new Promise((resolve, reject) => {
        fs.appendFile(fileName, content, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
            
        })
    })
} 

const promiseWriteFile = (fileName, content) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(fileName, content, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }    
        })
    })
} 

const promiseReadFile = (fileName) => {
    return new Promise((resolve, reject) => {
        fs.readFile(fileName, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
            
        })
    })
} 

const userDataToJson = (data) => {
    const userList = data.toString().split('\n');
    let users = [];
    for (userRaw of userList) {
        if (userRaw !== '') {
            const [username, password] = userRaw.split(' ');
            const user = {
                username,
                password
            };
            users.push(user);
        }
    }
    return users;
}

const checkUserExist = (userName) => {
    return new Promise((resolve, reject) => {
        promiseReadFile(databaseDir)
            .then(data => {
                const userList = userDataToJson(data);
                let userExist = false;
                userExist = userList.reduce((acc, user) => {
                    if (user.username === userName) return true;
                }, false);
                resolve(userExist);
            })
            .catch(err => reject(err))
    })
}

const checkBlogExist = (blogName) => {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(`./${blogName}`)) {
            resolve();
        } else {
            reject(new Error(`The blog ${blogName} does not exist!`));
        }
    });
}

const checkPostExist = (blogName, postTitle) => {
    return new Promise((resolve,reject) => {
        if (fs.existsSync(`./${blogName}/${postTitle}`)) {
            resolve();
        } else {
            reject(new Error(`The post ${postTitle} does not exist!`));
        }
    });
}

const checkIfNewPost = (blogName, postTitle) => {
    filePath = path.join(blogName, postTitle)
    return new Promise((resolve,reject) => {
        if (fs.existsSync(filePath)) {
            filePath = filePath + "_"
            resolve(filePath)
        } else {
            resolve(filePath)
        }
        if (err) {
            reject(err)
        }
    });
}

const readPost = (blogName, postTitle) => {
    return new Promise((resolve, reject) => {
        promiseReadFile(`./${blogName}/${postTitle}`)
            .then((data) => resolve(data))
            .catch(err => reject(err));
    });
}

const promiseMakeDirectory = (name) => {
    return new Promise((resolve, reject) => {
        fs.mkdir(`./${name}`, (err) => {
            if (err) {
                reject(err)
            } else {
                console.log("Directory was made!")
                resolve()
            }
        })
    })
}

const initializePost = (file, content, folder) => {

    return new Promise((resolve, reject) => {
        checkBlogExist(folder)
        .then(() => checkIfNewPost(folder, file))
        .then((filePath) => {
            promiseWriteFile(filePath, "likes: 1\nlikedBy: you\n")
            .then(() => promiseAppendFile(filePath, content))
            .then(() => resolve() )
            .catch((err) => console.log(err.message))
        })
        .catch(err => reject(err))
    });
}

const register = (username, password) => {
    return new Promise((resolve, reject) => {
        const userInfo = `${username} ${password}\n`;
        checkUserExist(username)
            .then((isExist) => {
                if (isExist) {
                    return new Promise ((resolve, reject) => 
                        reject(new Error('User already exist')));
                } else {
                    return new Promise ((resolve, reject) => resolve());
                }
            })
            .then(() => promiseAppendFile(databaseDir, userInfo))
            .then(() => resolve("User registration completed!"))
            .catch((err) => {
                if (err.code === 'ENOENT') {
                    promiseAppendFile(databaseDir, userInfo)
                        .then(() => resolve("User registration completed!"))
                        .catch((err) => reject(err));
                } else {
                    reject(err);
                }
            });
            
    });
}

const createABlog = (blogName) => {
    return new Promise((resolve, reject) => {
        promiseMakeDirectory(blogName)
            .then(() => resolve())
            .catch(err => reject(err))
    })
}

const createPost = (postTitle, postContent, blogName) => {

    if (postTitle.includes(" ")) {
        postTitle = postTitle.replace(" ", "_")
    }
    return new Promise((resolve, reject) => {
        initializePost(postTitle, postContent, blogName)
            .then(() => resolve())
            .catch(err => reject(err))
    })
}

const likePostOperation = (postContent, username, blogName, postTitle) => {
    return new Promise((resolve, reject) => {
        const [likes, likedBy, content] = postContent.toString().split('\n')
        const [, likesNum] = likes.split(':')
        const newLikesNum = Number(likesNum) + 1
        const newLikedBy = likedBy.trim() + ', ' + username
        const newContent = [`likes:${newLikesNum}`, newLikedBy, content].join('\n')
        promiseWriteFile(`./${blogName}/${postTitle}`,newContent)
            .then(() => resolve(`You liked the post ${postTitle}`))
            .catch(err => reject(err))
    })
}

const likePost = (blogName, postTitle, username) => {
    return new Promise((resolve, reject) => {
        checkUserExist(username)
            .then((isExist) => {
                if (isExist) {
                    return new Promise ((resolve, reject) => resolve());
                } else {
                    return new Promise ((resolve, reject) => 
                        reject(new Error('User does not exist')));
                }
            })
            .then(() => checkBlogExist(blogName))
            .then(() => checkPostExist(blogName, postTitle))
            .then(() => readPost(blogName, postTitle))
            .then(postContent => likePostOperation(postContent, username, blogName, postTitle))
            .then((message) => resolve(message))
            .catch(err => reject(err))
    })
}


register('bosco1', '1234')
    .then((message) => console.log(message))
    .catch((err) => console.log(err.message))

createABlog("blog").catch(err => console.log(err.message))

createPost("adel", "hello", "blog")
    .then((message) => console.log(message))
    .catch((err) => console.log(err))

likePost('blog', 'adel', 'bosco1').catch((err) => console.log(err))