/* This here for modularity, I can just pass in the author, title, etc.  via the slots instead of an additional bulky .js*/
class MyPost extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });

    /*     
        I accidentally added two style tags
        For some reason when one is removed, the element does not look the way its supposed to 
        so I'm not gonna touch it
    */

    shadow.innerHTML = `
    <style>
      <style>
            :host {
            display: block;
            max-width: 700px;
            margin: 20px auto;
            font-family: "Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS", sans-serif;
            }
            .discussion-post {
            background-color: #EEF3F4;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 20px;
            display: flex;
            gap: 16px;
            width: 100%; 
            max-width: 700px; 
            box-sizing: border-box; 
            }
            .avatar img {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            }
            .post-content {
            flex: 1; 
            width: 100%; 
            }
            .post-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            }
            .author-name {
            font-weight: bold;
            font-size: 1.1em;
            }
            .timestamp {
            color: #888;
            font-size: 0.9em;
            }
            .message {
            margin-top: 10px;
            line-height: 1.6;
            word-wrap: break-word; 
            }
            .reply-button {
            margin-top: 15px;
            background-color: #2d72d9;
            color: white;
            border: none;
            padding: 8px 14px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.9em;
            }
            .reply-button:hover {
            background-color: #1b5bbf;
            }
            .delete-button {
          margin-top: 10px;
          background-color: #d9534f;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 0.9em;
        }
        .delete-button:hover {
          background-color: #c9302c;
        }
        </style>
    </style>

    <div class="discussion-post">
      <div class="post-content">
        <div class="post-header">
          <span class="author-name"><slot name="author">Unknown</slot></span>
          <span class="timestamp"><slot name="time">Jan 1, 1970 0:00</slot></span>
        </div>
        <div class="message">
          <slot name="content">Lorem Ipsum dolor sit amet</slot>
        </div>
        <!-- <button class="reply-button">Reply</button>-->
        <!-- <button class="delete-button">Delete</button> -->
      </div>
    </div>
  `;
  }
}

customElements.define("my-post", MyPost);
