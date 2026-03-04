(function (Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('SAM TTS extension must be run unsandboxed.');
  }

  const SAM_CDN_URLS = [
    'https://cdn.jsdelivr.net/npm/sam-js@0.3.1/dist/samjs.min.js',
    'https://unpkg.com/sam-js@0.3.1/dist/samjs.min.js'
  ];

  class SamTTSExtension {
    constructor() {
      this.voice = {
        pitch: 50,
        speed: 50,
        mouth: 50,
        throat: 50
      };

      this.audioContext = null;
      this.currentSource = null;
      this.SamCtor = null;
      this.sam = null;

      this._samReadyPromise = this._loadSam();
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

    _getAudioContext() {
      if (!this.audioContext) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new Ctx();
      }
      return this.audioContext;
    }

    async _loadFromScript(url) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Failed to load ${url}`));
        document.head.appendChild(script);
      });

      const ctor = window.SamJs || window.SAM || window.sam;
      if (!ctor) {
        throw new Error(`sam-js loaded from ${url}, but no global constructor found.`);
      }
      return ctor;
    }

    async _loadSam() {
      if (this.SamCtor) return;

      const existingCtor = window.SamJs || window.SAM || window.sam;
      if (existingCtor) {
        this.SamCtor = existingCtor;
        this._applyVoice();
        return;
      }

      let lastError;
      for (const url of SAM_CDN_URLS) {
        try {
          this.SamCtor = await this._loadFromScript(url);
          this._applyVoice();
          return;
        } catch (err) {
          lastError = err;
        }
      }

      throw lastError || new Error('Unable to load sam-js.');
    }

    _applyVoice() {
      if (!this.SamCtor) return;
      this.sam = new this.SamCtor(this.voice);
    }

    async _playText(text) {
      await this._samReadyPromise;
      this.stopSpeaking();

      const safeText = String(text || '').trim() || 'Hello world!';
      const buf32 = this.sam.buf32(safeText);
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
      return this._playText(args.TEXT);
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
})(Scratch);
