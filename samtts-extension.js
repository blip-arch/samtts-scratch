import SamJs from 'sam-js';

class SamTTSExtension {
  constructor() {
    this.sam = new SamJs({
      pitch: 50,
      speed: 50,
      mouth: 50,
      throat: 50
    });

    this.audioContext = null;
    this.currentSource = null;

    this.voice = {
      pitch: 50,
      speed: 50,
      mouth: 50,
      throat: 50
    };
  }

  getInfo() {
    return {
      id: 'samtts',
      name: 'SAM TTS',
      blocks: [
        {
          opcode: 'speakHelloWorld',
          blockType: Scratch.BlockType.COMMAND,
          text: 'speak button say (hello world!)'
        },
        {
          opcode: 'speakText',
          blockType: Scratch.BlockType.COMMAND,
          text: 'speak [TEXT]',
          arguments: {
            TEXT: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'Hello world!'
            }
          }
        },
        {
          opcode: 'stopSpeaking',
          blockType: Scratch.BlockType.COMMAND,
          text: 'stop speaking'
        },
        {
          opcode: 'setPitch',
          blockType: Scratch.BlockType.COMMAND,
          text: 'change pitch to [VALUE]',
          arguments: {
            VALUE: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 50
            }
          }
        },
        {
          opcode: 'setSpeed',
          blockType: Scratch.BlockType.COMMAND,
          text: 'change speed to [VALUE]',
          arguments: {
            VALUE: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 50
            }
          }
        },
        {
          opcode: 'setMouth',
          blockType: Scratch.BlockType.COMMAND,
          text: 'change mouth to [VALUE]',
          arguments: {
            VALUE: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 50
            }
          }
        },
        {
          opcode: 'setThroat',
          blockType: Scratch.BlockType.COMMAND,
          text: 'change throat to [VALUE]',
          arguments: {
            VALUE: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 50
            }
          }
        }
      ]
    };
  }

  _clamp(value) {
    const number = Number(value);
    if (Number.isNaN(number)) return 50;
    return Math.max(0, Math.min(255, number));
  }

  _applyVoice() {
    this.sam = new SamJs(this.voice);
  }

  _getAudioContext() {
    if (!this.audioContext) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new Ctx();
    }
    return this.audioContext;
  }

  async _playText(text) {
    this.stopSpeaking();

    const buf32 = this.sam.buf32(text);
    const ctx = this._getAudioContext();

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const sampleRate = 22050;
    const audioBuffer = ctx.createBuffer(1, buf32.length, sampleRate);
    audioBuffer.copyToChannel(buf32, 0);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.onended = () => {
      if (this.currentSource === source) {
        this.currentSource = null;
      }
    };

    this.currentSource = source;
    source.start(0);
  }

  speakHelloWorld() {
    return this._playText('Hello world!');
  }

  speakText(args) {
    const text = String(args.TEXT || '');
    return this._playText(text);
  }

  stopSpeaking() {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource.disconnect();
      this.currentSource = null;
    }
  }

  setPitch(args) {
    this.voice.pitch = this._clamp(args.VALUE);
    this._applyVoice();
  }

  setSpeed(args) {
    this.voice.speed = this._clamp(args.VALUE);
    this._applyVoice();
  }

  setMouth(args) {
    this.voice.mouth = this._clamp(args.VALUE);
    this._applyVoice();
  }

  setThroat(args) {
    this.voice.throat = this._clamp(args.VALUE);
    this._applyVoice();
  }
}

Scratch.extensions.register(new SamTTSExtension());
